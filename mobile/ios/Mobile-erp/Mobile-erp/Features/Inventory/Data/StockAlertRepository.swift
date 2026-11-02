import Foundation

/// A stock-alert rule caps a (model, storage) pair at a minimum threshold.
struct StockAlertRuleView: Decodable, Identifiable {
    let id: String
    let modelId: String
    let storage: String
    let threshold: Int
}

/// A rule plus the live on-hand count (`GET /stock-alert-rules/low-stock`).
struct LowStockView: Decodable, Identifiable {
    let id: String
    let modelId: String
    let storage: String
    let threshold: Int
    let currentCount: Int

    var isBelow: Bool { currentCount < threshold }
}

/// The only place that talks to `/stock-alert-rules`. Reads need `device.read`;
/// writes need `settings.manage`.
@MainActor
struct StockAlertRepository {
    let api: APIClient

    init(_ container: AppContainer) {
        self.api = container.api
    }

    func lowStock() async throws -> [LowStockView] {
        try await api.get("/stock-alert-rules/low-stock")
    }

    func list() async throws -> [StockAlertRuleView] {
        try await api.get("/stock-alert-rules")
    }

    func create(modelId: String, storage: String, threshold: Int) async throws {
        try await api.postVoid("/stock-alert-rules",
                               body: CreateBody(modelId: modelId, storage: storage, threshold: threshold))
    }

    func update(id: String, storage: String, threshold: Int) async throws {
        try await api.patchVoid("/stock-alert-rules/\(id)",
                                body: UpdateBody(storage: storage, threshold: threshold))
    }

    private struct CreateBody: Encodable {
        let modelId: String
        let storage: String
        let threshold: Int
    }

    private struct UpdateBody: Encodable {
        let storage: String
        let threshold: Int
    }
}
