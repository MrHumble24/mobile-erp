import Foundation

/// PATCH sender for this slice. The foundation `APIClient` exposes only
/// GET/POST, but the inventory update endpoints (`PATCH /devices/:id`,
/// `/device-models/:id`, `/stock-alert-rules/:id`) are PATCH. Rather than edit
/// foundation code, this reuses the same base URL (`DevConfig`) and keychain
/// token and mirrors `APIClient`'s envelope-aware error mapping. Writes only —
/// the response body is ignored (callers refetch / re-sync).
@MainActor
struct InventoryHTTP {
    let baseURL: URL
    let token: String?

    init(baseURL: URL, token: String?) {
        self.baseURL = baseURL
        self.token = token
    }

    /// Build from the container: the live base URL plus the stored JWT.
    init(_ container: AppContainer) {
        self.init(baseURL: container.devConfig.baseURL, token: Keychain().string(.token))
    }

    /// PATCH an open-ended JSON body (device specs hold mixed value types).
    func patch(_ path: String, json: [String: Any]) async throws {
        try await send(path, body: try JSONSerialization.data(withJSONObject: json))
    }

    /// PATCH a typed, whitelisted DTO.
    func patch(_ path: String, body: some Encodable) async throws {
        try await send(path, body: try JSONEncoder().encode(body))
    }

    private func send(_ path: String, body: Data) async throws {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = body

        let data: Data, response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw AppError.network
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw AppError(statusCode: status, body: data)
        }
    }
}
