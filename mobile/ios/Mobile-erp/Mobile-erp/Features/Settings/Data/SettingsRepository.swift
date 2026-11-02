import Foundation

/// The only place the Settings slice talks HTTP. `GET /settings` is open to any
/// authenticated user; `PUT /settings` needs `settings.manage` and goes through
/// `MutationHTTP` (the Core client has no PUT).
@MainActor
struct SettingsRepository {
    let api: APIClient
    let mut: SettingsMutationHTTP

    func get() async throws -> StoreSettings {
        try await api.get("/settings")
    }

    func update(_ values: SettingsValues) async throws {
        try await mut.putVoid("/settings", values.body())
    }
}
