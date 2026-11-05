import Foundation

/// Report shapes for the trend chart, profit breakdowns, returns, nasiya
/// (consignments) and inventory tabs. All numbers are server-computed display
/// Doubles — render money through `MoneyText`. Cost-derived fields (`cogs`,
/// `grossProfit`, `landedValue`) are stripped by the server's
/// `CostRedactionInterceptor` for users without `device.cost.view`, so every
/// decoder tolerates their absence (→ 0 / nil) rather than failing.

/// One point of the revenue/profit/expense trend (`/reports/trend`).
struct TrendPoint: Decodable, Identifiable {
    let bucket: String
    let revenue: Double
    let grossProfit: Double
    let expenses: Double
    var id: String { bucket }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        bucket = (try? c.decode(String.self, forKey: .bucket)) ?? ""
        func d(_ k: CodingKeys) -> Double { (try? c.decode(Double.self, forKey: k)) ?? 0 }
        revenue = d(.revenue); grossProfit = d(.grossProfit); expenses = d(.expenses)
    }
    private enum CodingKeys: String, CodingKey { case bucket, revenue, grossProfit, expenses }
}

/// One profit-breakdown row (`/reports/profit/breakdown`), keyed by channel,
/// model, cashier or day. `share` is 0–1 of total revenue.
struct FinBreakdownRow: Decodable, Identifiable {
    let key: String
    let label: String
    let revenue: Double
    let cogs: Double
    let grossProfit: Double
    let unitsSold: Int
    let share: Double
    var id: String { key }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        key = (try? c.decode(String.self, forKey: .key)) ?? ""
        label = (try? c.decode(String.self, forKey: .label)) ?? ""
        func d(_ k: CodingKeys) -> Double { (try? c.decode(Double.self, forKey: k)) ?? 0 }
        revenue = d(.revenue); cogs = d(.cogs); grossProfit = d(.grossProfit); share = d(.share)
        unitsSold = (try? c.decode(Int.self, forKey: .unitsSold)) ?? 0
    }
    private enum CodingKeys: String, CodingKey {
        case key, label, revenue, cogs, grossProfit, unitsSold, share
    }
}

struct ReturnRow: Decodable, Identifiable {
    let id: String
    let imei: String?
    let serialNumber: String?
    let model: String
    let refundAmount: Double
    let reason: String?
    let returnedAt: String
    /// The code to show: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

struct ReturnsPage: Decodable {
    let items: [ReturnRow]
    let total: Int
}

struct ConsignmentPartnerRow: Decodable, Identifiable {
    let partnerId: String
    let shopName: String
    let outstanding: Double
    let openCount: Int
    let overdueCount: Int
    let settledRevenue: Double
    var id: String { partnerId }
}

struct ConsignmentsReport: Decodable {
    let createdCount: Int
    let settledCount: Int
    let returnedCount: Int
    let settledRevenue: Double
    let outstandingTotal: Double
    let overdueCount: Int
    let byPartner: [ConsignmentPartnerRow]
}

struct InventoryStatusRow: Decodable, Identifiable {
    let statusCode: String
    let label: String
    let count: Int
    var id: String { statusCode }
}

/// `landedValue` is optional — redacted without `device.cost.view`.
struct InventoryModelRow: Decodable, Identifiable {
    let modelId: String
    let label: String
    let units: Int
    let landedValue: Double?
    let avgDaysInStock: Double
    var id: String { modelId }
}

struct InventoryAgingRow: Decodable, Identifiable {
    let bucket: String
    let units: Int
    let landedValue: Double?
    var id: String { bucket }
}

struct InventoryReport: Decodable {
    let inStockUnits: Int
    let inStockLandedValue: Double?
    let defectiveUnits: Int
    let consignedUnits: Int
    let byStatus: [InventoryStatusRow]
    let byModel: [InventoryModelRow]
    let aging: [InventoryAgingRow]
}
