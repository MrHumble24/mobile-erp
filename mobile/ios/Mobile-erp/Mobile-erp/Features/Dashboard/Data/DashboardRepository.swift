import Foundation

/// Reads the dashboard's data sources. Each endpoint needs its own permission
/// (gated in the UI), so they are exposed separately rather than as one call.
/// All online reads.
@MainActor
struct DashboardRepository {
    let api: APIClient

    func profit(from: Date, to: Date) async throws -> DashProfit {
        let iso = ISO8601DateFormatter()
        return try await api.get("/reports/profit",
                                 query: ["from": iso.string(from: from), "to": iso.string(from: to)])
    }

    func modelPricing() async throws -> [DashPricingRow] {
        try await api.get("/reports/model-pricing")
    }

    func lowStock() async throws -> [LowStockItem] {
        try await api.get("/stock-alert-rules/low-stock")
    }

    func overdue() async throws -> [OverdueConsignment] {
        try await api.get("/consignments/overdue")
    }

    /// Model id → label; empty map when the user may not read device models.
    func deviceModelLabels() async -> [String: String] {
        guard let rows: [DashDeviceModelRef] = try? await api.get("/device-models") else { return [:] }
        return Dictionary(rows.map { ($0.id, $0.label) }, uniquingKeysWith: { a, _ in a })
    }
}
