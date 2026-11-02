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
    var label: String { "\(brand) \(name)".trimmingCharacters(in: .whitespaces) }
}

struct SaleDevice: Decodable {
    let imei: String
    let model: SaleModelRef
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

/// A completed sale as returned by `/sales`. Cost fields (`landedCostSnapshot`,
/// `netProfit`) are redacted — OMITTED — for under-privileged users, so they are
/// optional here; never assume a value. Channel is DERIVED from `consignmentId`.
struct SaleView: Decodable, Identifiable {
    let id: String
    let device: SaleDevice
    let customer: SaleCustomerRef?
    let salePrice: MoneyValue
    let landedCostSnapshot: MoneyValue?
    let netProfit: MoneyValue?
    let soldAt: String?
    let soldBy: SalePerson
    let warranty: SaleWarranty?
    let consignmentId: String?

    var isB2B: Bool { consignmentId != nil }
}

struct SalesPage: Decodable {
    let items: [SaleView]
    let total: Int
}

/// Client-only filter state for the sales list (sent to the server, which
/// derives `channel` from `consignmentId`).
struct SaleFilters {
    var channel: String?        // "retail" | "b2b"
    var returned: String?       // "true" | "false"
    var search: String = ""
    var from: Date?
    var to: Date?

    var query: [String: String] {
        var q: [String: String] = [:]
        if let channel { q["channel"] = channel }
        if let returned { q["returned"] = returned }
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { q["search"] = trimmed }
        if let from { q["from"] = ISO8601DateFormatter().string(from: from) }
        if let to { q["to"] = ISO8601DateFormatter().string(from: to) }
        return q
    }
}
