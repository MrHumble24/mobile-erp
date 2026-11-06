import Foundation

/// Report aggregates — all numbers pre-computed server-side. Cost-based fields
/// (`avgAcquisitionCost`, `avgLandedCost`) are optional: absent/redacted for
/// users without cost visibility. Numbers are plain Doubles (display only);
/// render money through `MoneyText` on the Decimal-string form.

struct ProfitReport: Decodable {
    let revenue: Double
    let cogs: Double
    let unitsSold: Int
    let grossProfit: Double
    let expenses: Double
    let netOperatingIncome: Double
    let retail: Double
    let b2b: Double
    let returnsRefunded: Double
    /// Total given away in discounts over the period (ADR 0034).
    let discountsGiven: Double
    let bonusPointsEarned: Double
    let bonusPointsSpent: Double

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func d(_ k: CodingKeys) -> Double { (try? c.decode(Double.self, forKey: k)) ?? 0 }
        revenue = d(.revenue); cogs = d(.cogs); grossProfit = d(.grossProfit)
        expenses = d(.expenses); netOperatingIncome = d(.netOperatingIncome)
        returnsRefunded = d(.returnsRefunded)
        discountsGiven = d(.discountsGiven)
        bonusPointsEarned = d(.bonusPointsEarned)
        bonusPointsSpent = d(.bonusPointsSpent)
        unitsSold = (try? c.decode(Int.self, forKey: .unitsSold)) ?? 0
        let channel = try? c.decode([String: Double].self, forKey: .byChannel)
        retail = channel?["retail"] ?? 0
        b2b = channel?["b2b"] ?? 0
    }
    private enum CodingKeys: String, CodingKey {
        case revenue, cogs, unitsSold, grossProfit, expenses
        case netOperatingIncome, byChannel, returnsRefunded, discountsGiven
        case bonusPointsEarned, bonusPointsSpent
    }
}

struct ExpenseReportRow: Decodable, Identifiable {
    let key: String
    let label: String
    let total: Double
    var id: String { key }
}

struct ModelPricingRow: Decodable, Identifiable {
    let modelId: String
    let storage: String?
    let avgAcquisitionCost: Double?
    let avgSellingPrice: Double?
    let unitsInStock: Int
    let unitsSold: Int
    var id: String { modelId + (storage ?? "") }
}

struct DailyClosingReport: Decodable {
    let date: String
    let unitsSold: Int
    let revenue: Double
    let grossProfit: Double
    let expenses: Double
    let newConsignments: Int
    let settledConsignments: Int
}

/// Minimal device-model reference to label `modelId` in pricing rows. The slice
/// owns its own DTO — it may not reach into the inventory slice.
struct DeviceModelRef: Decodable {
    let id: String
    let brand: String?
    let name: String?
    var label: String { "\(brand ?? "") \(name ?? "")".trimmingCharacters(in: .whitespaces) }
}
