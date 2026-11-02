import Foundation

/// The single HTTP client — the only type that touches URLSession. Mirrors the
/// web `shared/api/http.ts`:
///  - attaches `Authorization: Bearer <token>`,
///  - maps every failure into `AppError` (envelope-aware),
///  - on a non-login 401 clears the session via `onUnauthorized`.
///
/// Base URL and token are read through closures so a dev-panel environment
/// switch (or a fresh login) takes effect on the next request with no rewiring.
@MainActor
final class APIClient {
    private let baseURL: () -> URL
    private let token: () -> String?
    private let session: URLSession

    /// Set by the container once the Session exists. Fired on a non-login 401.
    var onUnauthorized: (() -> Void)?

    init(baseURL: @escaping () -> URL,
         token: @escaping () -> String?,
         session: URLSession = .shared) {
        self.baseURL = baseURL
        self.token = token
        self.session = session
    }

    func get<T: Decodable>(_ path: String, query: [String: String] = [:]) async throws -> T {
        let data = try await perform(path, method: "GET", query: query, body: Optional<Int>.none)
        return try decode(data)
    }

    /// Open-ended JSON (the sync feed), parsed with JSONSerialization.
    func getJSON(_ path: String, query: [String: String] = [:]) async throws -> [String: Any] {
        let data = try await perform(path, method: "GET", query: query, body: Optional<Int>.none)
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
    }

    func post<T: Decodable>(_ path: String, body: some Encodable) async throws -> T {
        let data = try await perform(path, method: "POST", query: [:], body: body)
        return try decode(data)
    }

    func postVoid(_ path: String, body: some Encodable) async throws {
        _ = try await perform(path, method: "POST", query: [:], body: body)
    }

    /// Open-ended JSON body + response (the sync push, whose payloads are
    /// per-type blobs). Mirrors `getJSON`.
    func postJSON(_ path: String, body: [String: Any]) async throws -> [String: Any] {
        let data = try await performData(
            path, method: "POST", query: [:],
            bodyData: try JSONSerialization.data(withJSONObject: body)
        )
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
    }

    private func perform(
        _ path: String,
        method: String,
        query: [String: String],
        body: (some Encodable)?
    ) async throws -> Data {
        try await performData(
            path, method: method, query: query,
            bodyData: body.map { try? JSONEncoder().encode($0) } ?? nil
        )
    }

    private func performData(
        _ path: String,
        method: String,
        query: [String: String],
        bodyData: Data?
    ) async throws -> Data {
        var comps = URLComponents(
            url: baseURL().appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        )
        if !query.isEmpty {
            comps?.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = comps?.url else { throw AppError.network }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = token(), !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = bodyData

        let data: Data, response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw AppError.network
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            if status == 401 && !path.hasSuffix("/auth/login") { onUnauthorized?() }
            throw AppError(statusCode: status, body: data)
        }
        return data
    }

    private func decode<T: Decodable>(_ data: Data) throws -> T {
        if T.self == Empty.self { return Empty() as! T }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

/// Decodes/ignores a response body when the caller has nothing to read.
struct Empty: Codable {}
