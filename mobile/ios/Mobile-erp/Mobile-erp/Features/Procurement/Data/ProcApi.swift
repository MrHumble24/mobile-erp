import Foundation

/// The procurement slice's API surface. GET/POST go through the foundation
/// `APIClient` (the shared HTTP client); PATCH is added here because the shared
/// client does not expose it and supplier / shipment / QC-lookup updates need
/// it (the server routes are `@Patch`).
///
/// ponytail (foundation gap): PATCH is issued against the same base URL +
/// bearer token the shared client uses, so the duplication is confined to this
/// one file. The clean fix is a `patch` method on `APIClient`. A PATCH 401 is
/// surfaced as an `AppError` like any other; the next GET through `APIClient`
/// still clears the session.
@MainActor
struct ProcApi {
    let api: APIClient
    private let baseURL: () -> URL
    private let token: () -> String?

    init(_ container: AppContainer) {
        self.api = container.api
        let dev = container.devConfig
        self.baseURL = { dev.baseURL }
        self.token = { Keychain().string(.token) }
    }

    func patch<T: Decodable>(_ path: String, body: some Encodable) async throws -> T {
        try JSONDecoder().decode(T.self, from: await send(path, body: body))
    }

    func patchVoid(_ path: String, body: some Encodable) async throws {
        _ = try await send(path, body: body)
    }

    private func send(_ path: String, body: some Encodable) async throws -> Data {
        var req = URLRequest(url: baseURL().appendingPathComponent(path))
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token(), !t.isEmpty {
            req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = try JSONEncoder().encode(body)

        let data: Data, resp: URLResponse
        do { (data, resp) = try await URLSession.shared.data(for: req) }
        catch { throw AppError.network }

        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else { throw AppError(statusCode: status, body: data) }
        return data
    }
}
