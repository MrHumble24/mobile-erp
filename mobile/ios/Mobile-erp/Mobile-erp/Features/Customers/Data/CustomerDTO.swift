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

    var totalSpentString: String { NSDecimalNumber(value: totalSpent).stringValue }
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
    let device: Device

    struct Device: Decodable {
        let imei: String
        let model: Model
        struct Model: Decodable { let brand: String; let name: String }
    }

    var modelLabel: String {
        "\(device.model.brand) \(device.model.name)".trimmingCharacters(in: .whitespaces)
    }
}

/// `POST /customers`. Synthesized `Encodable` omits nil optionals, satisfying
/// the server's `forbidNonWhitelisted`.
struct CustomerPayload: Encodable {
    let name: String?
    let phone: String?
    let notes: String?
}

/// Slice-local input helper (duplicated from Pos's global on purpose — a slice
/// must not depend on another slice's symbols).
enum CustomersInput {
    static func orNil(_ value: String?) -> String? {
        let trimmed = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
