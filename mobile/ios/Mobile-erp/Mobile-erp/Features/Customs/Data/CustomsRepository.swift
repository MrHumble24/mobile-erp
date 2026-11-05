import Foundation

/// The only place that talks to `/customs/price-lists`. Reads need
/// `customs.read`, the create needs `customs.manage`. All online.
@MainActor
struct CustomsRepository {
    let api: APIClient

    /// The current list, or nil when no version exists yet (server sends `null`).
    func current() async throws -> CustomsCurrentList? {
        try await api.get("/customs/price-lists/current")
    }

    func versions() async throws -> [CustomsVersion] {
        try await api.get("/customs/price-lists")
    }

    func unmatchedModels() async throws -> [CustomsUnmatchedModel] {
        try await api.get("/customs/price-lists/unmatched-models")
    }

    func feeHistory(_ customsCode: String) async throws -> [CustomsFeePoint] {
        try await api.get("/customs/price-lists/fees/\(customsCode)/history")
    }

    /// Create a new version. Returns the saved summary.
    func create(_ body: CreateCustomsListDTO) async throws -> CustomsVersion {
        try await api.post("/customs/price-lists", body: body)
    }
}
