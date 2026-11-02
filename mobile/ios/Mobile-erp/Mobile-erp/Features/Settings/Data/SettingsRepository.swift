import Foundation

/// The only place the Settings slice talks HTTP. `GET /settings` is open to any
/// authenticated user; `PUT /settings` needs `settings.manage`. Both go through
/// the shared `APIClient` (its `putJSON` sends explicit `null` to clear fields).
@MainActor
struct SettingsRepository {
    let api: APIClient

    func get() async throws -> StoreSettings {
        try await api.get("/settings")
    }

    func update(_ values: SettingsValues) async throws {
        try await api.putJSONVoid("/settings", values.body())
    }
}
