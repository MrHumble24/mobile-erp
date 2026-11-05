import Foundation

/// A customer plus purchase aggregates derived server-side from their sales
/// (`GET /customers` and `GET /customers/:id`). `totalSpent` is a number here
/// (server-aggregated), not a Decimal string.
struct CustomerListItem: Decodable, Identifiable {
    let id: String
    let name: String
    let phone: String?
    let notes: String?
    let createdAt: String?
    let purchaseCount: Int
    let totalSpent: Double
    let lastPurchaseAt: String?
    let activeWarranties: Int
    let returnsCount: Int
    /// The customer's price level (ADR 0034); nil on an old response → walk-in.
    let priceLevelCode: String?
    /// Standing discount as a 2-dp percent string; nil/"0.00" = none.
    let standingDiscountPercent: String?

    var totalSpentString: String { NSDecimalNumber(value: totalSpent).stringValue }

    /// The level to use, defaulting to walk-in when the server omitted it.
    var level: String { priceLevelCode ?? PriceLevels.defaultCode }
    /// The standing discount as an exact percent (0 when none).
    var standing: Decimal { Decimal(string: standingDiscountPercent ?? "") ?? 0 }
}

struct CustomerPage: Decodable {
    let items: [CustomerListItem]
    let total: Int
}

/// Directory-wide summary tiles (`GET /customers/stats`).
struct CustomerStats: Decodable {
    let total: Int
    let newThisMonth: Int
    let withPurchases: Int
    let repeatBuyers: Int
}

/// One row of a customer's purchase history (`GET /customers/:id/sales`).
struct CustomerSale: Decodable, Identifiable {
    let id: String
    let salePrice: String
    let soldAt: String?
    /// Null for a quantity sale (a later task) — model is at the top level then.
    let device: Device?
    let model: Device.Model?

    struct Device: Decodable {
        let imei: String?
        let serialNumber: String?
        let model: Model
        struct Model: Decodable { let brand: String; let name: String }
        /// The code to show: the IMEI when present, else the serial number.
        var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }
    }

    /// The unit's code (IMEI or serial), empty for a quantity sale.
    var unitCode: String { device?.unitCode ?? "" }

    var modelLabel: String {
        let m = device?.model ?? model
        return "\(m?.brand ?? "") \(m?.name ?? "")".trimmingCharacters(in: .whitespaces)
    }
}

/// `POST /customers`. Synthesized `Encodable` omits nil optionals, satisfying
/// the server's `forbidNonWhitelisted`.
struct CustomerPayload: Encodable {
    let name: String?
    let phone: String?
    let notes: String?
    /// Price level and standing discount (ADR 0034). Sent on create and update.
    let priceLevelCode: String?
    let standingDiscountPercent: Double?
}

/// Slice-local input helper (duplicated from Pos's global on purpose — a slice
/// must not depend on another slice's symbols).
enum CustomersInput {
    static func orNil(_ value: String?) -> String? {
        let trimmed = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
