import Foundation

/// The only place that talks to `/reports/*` (perm `report.finance`), plus a
/// best-effort `/device-models` read to label pricing rows. All online reads.
@MainActor
struct ReportsRepository {
    let api: APIClient

    func profit(from: Date?, to: Date?) async throws -> ProfitReport {
        try await api.get("/reports/profit", query: range(from, to))
    }

    func expenses(from: Date?, to: Date?, groupBy: String) async throws -> [ExpenseReportRow] {
        var q = range(from, to); q["groupBy"] = groupBy
        return try await api.get("/reports/expenses", query: q)
    }

    func modelPricing(windowDays: Int = 90) async throws -> [ModelPricingRow] {
        try await api.get("/reports/model-pricing", query: ["windowDays": String(windowDays)])
    }

    func dailyClosing(date: Date) async throws -> DailyClosingReport {
        try await api.get("/reports/daily-closing", query: ["date": iso(date)])
    }

    /// Model id → label; empty map when the user may not read device models.
    func deviceModelLabels() async -> [String: String] {
        guard let rows: [DeviceModelRef] = try? await api.get("/device-models") else { return [:] }
        return Dictionary(rows.map { ($0.id, $0.label) }, uniquingKeysWith: { a, _ in a })
    }

    private func range(_ from: Date?, _ to: Date?) -> [String: String] {
        var q: [String: String] = [:]
        if let from { q["from"] = iso(from) }
        if let to { q["to"] = iso(to) }
        return q
    }
    private func iso(_ date: Date) -> String { ISO8601DateFormatter().string(from: date) }
}
