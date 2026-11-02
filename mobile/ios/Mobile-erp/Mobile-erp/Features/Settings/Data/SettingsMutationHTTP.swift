import Foundation

/// PUT / PATCH / DELETE helper.
///
/// The Core `APIClient` only exposes GET and POST, and foundation files are
/// off-limits to feature slices, so the remaining verbs the admin endpoints
/// need live here. Bodies are `[String: Any]` (like the sync push) so a field
/// can be sent as an explicit JSON `null` with `NSNull` — the web clears store
/// fields that way. Errors map through the shared `AppError` envelope and a
/// non-login 401 fires `onUnauthorized` (wired to clear the session).
///
/// ponytail: duplicated verbatim in the Users slice — no cross-slice import is
/// allowed. Fold both into Core/APIClient once it gains PUT/PATCH/DELETE.
@MainActor
struct SettingsMutationHTTP {
    let baseURL: () -> URL
    var onUnauthorized: (() -> Void)?
    private let token: () -> String? = { Keychain().string(.token) }

    func put<T: Decodable>(_ path: String, _ body: [String: Any]) async throws -> T {
        try decode(try await raw("PUT", path, body))
    }

    func patch<T: Decodable>(_ path: String, _ body: [String: Any]) async throws -> T {
        try decode(try await raw("PATCH", path, body))
    }

    @discardableResult
    func putVoid(_ path: String, _ body: [String: Any]) async throws -> Data {
        try await raw("PUT", path, body)
    }

    func delete(_ path: String) async throws {
        _ = try await raw("DELETE", path, nil)
    }

    private func raw(_ method: String, _ path: String, _ body: [String: Any]?) async throws -> Data {
        var req = URLRequest(url: baseURL().appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = token(), !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body { req.httpBody = try JSONSerialization.data(withJSONObject: body) }

        let data: Data, response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw AppError.network
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            if status == 401 { onUnauthorized?() }
            throw AppError(statusCode: status, body: data)
        }
        return data
    }

    private func decode<T: Decodable>(_ data: Data) throws -> T {
        try JSONDecoder().decode(T.self, from: data)
    }
}
