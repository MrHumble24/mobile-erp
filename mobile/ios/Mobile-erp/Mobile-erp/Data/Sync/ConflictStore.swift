import Foundation

/// Server-side sync conflicts (permission `sync.resolve`). Wave 1 builds the
/// inbox UI on top of this; wave 0 ships the fetch + resolve calls so the
/// contract is fixed. Row shape is owned by the server.
@MainActor
struct ConflictStore {
    let api: APIClient

    func list() async throws -> [[String: Any]] {
        let json = try await api.getJSON("/sync/conflicts")
        return json["conflicts"] as? [[String: Any]] ?? []
    }

    /// `POST /sync/conflicts/:id/resolve` with `keep-server` or `apply-terminal`.
    func resolve(id: String, resolution: String, note: String? = nil) async throws {
        var body: [String: Any] = ["resolution": resolution]
        if let note { body["note"] = note }
        _ = try await api.postJSON("/sync/conflicts/\(id)/resolve", body: body)
    }
}
