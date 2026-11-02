import Foundation

/// FOUNDATION GAP WORKAROUND: `APIClient` (Core, which this slice may not edit)
/// exposes only GET/POST, but deleting an expense needs HTTP DELETE. This is a
/// minimal authed DELETE that mirrors `APIClient`'s auth header + `AppError`
/// envelope mapping, reading the same keychain token and the live base URL.
/// When `APIClient` gains `delete`/`patch`, drop this and call it instead.
enum AuthedHTTP {
    @MainActor
    static func delete(_ path: String, baseURL: URL) async throws {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "DELETE"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = Keychain().string(.token), !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
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
