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

    // MARK: - PUT / PATCH / DELETE (same auth header, envelope + 401 path as above)

    func patch<T: Decodable>(_ path: String, body: some Encodable) async throws -> T {
        try decode(try await perform(path, method: "PATCH", query: [:], body: body))
    }

    func patchVoid(_ path: String, body: some Encodable) async throws {
        _ = try await perform(path, method: "PATCH", query: [:], body: body)
    }

    func delete(_ path: String) async throws {
        _ = try await performData(path, method: "DELETE", query: [:], bodyData: nil)
    }

    /// Open-ended JSON bodies (admin writes send an explicit JSON `null` via
    /// `NSNull` to clear a field), mirroring `postJSON`.
    func patchJSON<T: Decodable>(_ path: String, _ body: [String: Any]) async throws -> T {
        try decode(try await performJSON(path, method: "PATCH", body: body))
    }

    func putJSON<T: Decodable>(_ path: String, _ body: [String: Any]) async throws -> T {
        try decode(try await performJSON(path, method: "PUT", body: body))
    }

    func putJSONVoid(_ path: String, _ body: [String: Any]) async throws {
        _ = try await performJSON(path, method: "PUT", body: body)
    }

    func patchJSONVoid(_ path: String, _ body: [String: Any]) async throws {
        _ = try await performJSON(path, method: "PATCH", body: body)
    }

    private func performJSON(_ path: String, method: String, body: [String: Any]) async throws -> Data {
        try await performData(
            path, method: method, query: [:],
            bodyData: try JSONSerialization.data(withJSONObject: body)
        )
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
        if !query.isEmpty { comps?.queryItems = Self.canonicalQuery(query) }
        guard let url = comps?.url else { throw AppError.network }

        var req = URLRequest(url: url)
        req.timeoutInterval = 15
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = token(), !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = bodyData

        let logId = NetLogStore.shared.begin(
            method: method, url: url.absoluteString,
            headers: req.allHTTPHeaderFields ?? [:], body: bodyData
        )

        let data: Data, response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            // Offline / server unreachable: serve the last good GET from the
            // native URLCache so every read screen keeps working offline.
            // Writes (non-GET) are never faked — they queue in the outbox.
            if method == "GET", let cached = URLCache.shared.cachedResponse(for: req) {
                NetLogStore.shared.finish(logId, status: nil, body: cached.data,
                                          error: "offline: served cached response")
                AppLog.warn("net", "\(method) \(path) offline — served cached response")
                return cached.data
            }
            NetLogStore.shared.finish(logId, status: nil, body: nil,
                                      error: error.localizedDescription)
            AppLog.error("net", "\(method) \(path) failed: \(error.localizedDescription)")
            throw AppError.network
        }

        let http = response as? HTTPURLResponse
        let status = http?.statusCode ?? 0
        NetLogStore.shared.finish(
            logId, status: status,
            headers: (http?.allHeaderFields as? [String: String]) ?? [:], body: data
        )
        guard (200..<300).contains(status) else {
            if status == 401 && !path.hasSuffix("/auth/login") {
                AppLog.warn("auth", "401 on \(path) — clearing session")
                onUnauthorized?()
            }
            throw AppError(statusCode: status, body: data)
        }
        // Cache successful reads for the offline fallback above. Cleared on
        // logout/401 (Session.clear) so one user never sees another's data.
        if method == "GET", let http {
            URLCache.shared.storeCachedResponse(
                CachedURLResponse(response: http, data: data), for: req)
        }
        return data
    }

    /// Query items in a stable, key-sorted order. Swift randomizes `Dictionary`
    /// iteration per process launch, so an unsorted multi-param URL differs
    /// between launches and defeats the offline response cache (keyed on the
    /// exact URL). Sorting makes the same request produce the same URL every run.
    static func canonicalQuery(_ query: [String: String]) -> [URLQueryItem] {
        query.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
    }

    private func decode<T: Decodable>(_ data: Data) throws -> T {
        if T.self == Empty.self { return Empty() as! T }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

/// Decodes/ignores a response body when the caller has nothing to read.
struct Empty: Codable {}
