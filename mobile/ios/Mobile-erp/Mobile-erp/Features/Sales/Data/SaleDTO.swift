import Foundation

/// Money arrives as a Decimal **string** (Prisma serializes it so). Decode it as
/// a string, tolerating a numeric encoding, and keep it exact — never a Double.
struct MoneyValue: Decodable {
    let string: String
    init(_ string: String) { self.string = string }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let s = try? c.decode(String.self) { string = s }
        else if let d = try? c.decode(Double.self) { string = NSDecimalNumber(value: d).stringValue }
        else { string = "0" }
    }
}

struct SaleModelRef: Decodable {
    let brand: String
    let name: String
    /// IMEI | SERIAL | QUANTITY (nil when the server omits it).
    let kindCode: String?
    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
}

struct SaleDevice: Decodable {
    /// Null on a serial unit (ADR 0029) — use `unitCode` for display.
    let imei: String?
    let imei2: String?
    let serialNumber: String?
    let model: SaleModelRef

    /// The code to show: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
}

struct SaleCustomerRef: Decodable {
    let id: String
    let name: String
    let phone: String?
}

struct SalePerson: Decodable {
    let id: String
    let name: String
}

struct SaleWarranty: Decodable {
    let days: Int
    let startsAt: String?
    let endsAt: String?
}

/// One tender line of a sale (`{ accountCode, amount }`). `amount` is a Decimal
/// string. Older cached sales have no `payments` array — model it optional.
struct SalePaymentLine: Decodable, Identifiable {
    let accountCode: String
    let amount: MoneyValue
    var id: String { accountCode }
}

/// A completed sale as returned by `/sales`. Cost fields (`landedCostSnapshot`,
/// `netProfit`) are redacted — OMITTED — for under-privileged users, so they are
/// optional here; never assume a value. Channel is DERIVED from `consignmentId`.
struct SaleView: Decodable, Identifiable {
    let id: String
    /// Null for a quantity sale (no unit) — a later task stocks those; model and
    /// quantity are carried at the top level then (ADR 0029).
    let device: SaleDevice?
    let model: SaleModelRef?
    let quantity: Int?
    let customer: SaleCustomerRef?
    let salePrice: MoneyValue
    let landedCostSnapshot: MoneyValue?
    let netProfit: MoneyValue?
    let soldAt: String?
    let soldBy: SalePerson
    let warranty: SaleWarranty?
    let consignmentId: String?
    /// Set once the device came back; the return action hides when present.
    let returnedAt: String?
    /// How the sale was tendered; `[]` when none, nil for pre-feature cached data.
    let payments: [SalePaymentLine]?
    /// Pricing (ADR 0034): the list price the sale was priced from, the discount
    /// given and the level. Optional — a pre-feature sale has none.
    let listPrice: MoneyValue?
    let discountAmount: MoneyValue?
    let priceLevelCode: String?

    var isB2B: Bool { consignmentId != nil }
    /// Show the pricing block when a discount was given or the level is not retail.
    var showsPricing: Bool {
        (Decimal(string: discountAmount?.string ?? "0") ?? 0) > 0
            || (priceLevelCode != nil && priceLevelCode != PriceLevels.retail)
    }
    var isReturned: Bool { returnedAt != nil }
    /// A quantity sale (ADR 0030): no unit, carries `model` + `quantity`.
    var isQuantitySale: Bool { quantity != nil }

    /// Brand + name from the unit's model, falling back to the top-level model
    /// (quantity sale).
    var modelLabel: String { device?.model.label ?? model?.label ?? "" }
    /// The unit's code (IMEI or serial), empty for a quantity sale.
    var unitCode: String { device?.unitCode ?? "" }
    var modelBrand: String { device?.model.brand ?? model?.brand ?? "" }
    var modelName: String { device?.model.name ?? model?.name ?? "" }
    /// The line "× N" for a quantity sale; empty for a unit sale.
    var quantityLabel: String { quantity.map { "× \($0)" } ?? "" }
}

struct SalesPage: Decodable {
    let items: [SaleView]
    let total: Int
}

/// Aggregates over the filtered sale set (`GET /sales/stats`). `netProfit` is
/// redacted (omitted) for users without cost visibility — optional here.
struct SaleStatsView: Decodable {
    let count: Int
    let revenue: MoneyValue
    let avgPrice: MoneyValue
    let returnedCount: Int
    let refundTotal: MoneyValue
    let netProfit: MoneyValue?
}

/// A cashier option for the sold-by filter (`GET /users`, gated on `user.read`).
struct SalesCashier: Decodable, Identifiable {
    let id: String
    let name: String
}

/// Client-only filter state for the sales list (sent to the server, which
/// derives `channel` from `consignmentId`).
struct SaleFilters: Equatable {
    var channel: String?        // "retail" | "b2b"
    var returned: String?       // "true" | "false"
    var warranty: String?       // "active" | "expired"
    var soldById: String?
    var search: String = ""
    var from: Date?
    var to: Date?

    /// Any sheet filter set (search lives in the search bar, so it's not counted).
    var isActive: Bool {
        channel != nil || returned != nil || warranty != nil || soldById != nil || from != nil || to != nil
    }

    var query: [String: String] {
        var q: [String: String] = [:]
        if let channel { q["channel"] = channel }
        if let returned { q["returned"] = returned }
        if let warranty { q["warranty"] = warranty }
        if let soldById { q["soldById"] = soldById }
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { q["search"] = trimmed }
        if let from { q["from"] = ISO8601DateFormatter().string(from: from) }
        if let to { q["to"] = ISO8601DateFormatter().string(from: to) }
        return q
    }
}
