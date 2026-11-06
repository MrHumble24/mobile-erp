import Foundation

/// Online storefront orders (ADR 0049, 0050; handoff 029). Read-only shapes from
/// `GET /storefront-orders[/:id|/stats]`; the one write is a status change. Dates
/// are ISO strings (rendered via `KitDate`). `specs` holds the variant (storage,
/// color). Online only — never cached, never queued.

struct StorefrontOrderListItem: Decodable, Identifiable {
    let id: String
    let storeId: String
    let storeName: String
    let modelId: String
    let brand: String
    let productName: String
    let modelName: String
    let specs: [String: String]?
    let customerName: String
    let customerPhone: String
    let note: String?
    let statusCode: String
    let statusLabel: String
    let handledAt: String?
    let handledByName: String?
    let saleId: String?
    let createdAt: String
    let updatedAt: String

    /// "Brand Model" for the row, falling back to the model name.
    var productLine: String {
        "\(brand) \(productName.isEmpty ? modelName : productName)".trimmingCharacters(in: .whitespaces)
    }
    /// The variant line (storage · color), nil when empty.
    var specLine: String? { OrderSpecs.line(specs) }
}

struct StorefrontOrderHistoryItem: Decodable, Identifiable {
    let id: String
    let fromStatusCode: String?
    let toStatusCode: String
    let toStatusLabel: String
    let changedAt: String
    let changedByName: String?
    let note: String?
}

struct StorefrontOrderDetail: Decodable, Identifiable {
    let id: String
    let storeId: String
    let storeName: String
    let brand: String
    let productName: String
    let modelName: String
    let specs: [String: String]?
    let customerName: String
    let customerPhone: String
    let note: String?
    let statusCode: String
    let statusLabel: String
    let handledAt: String?
    let handledByName: String?
    let createdAt: String
    let history: [StorefrontOrderHistoryItem]

    var productLine: String {
        "\(brand) \(productName.isEmpty ? modelName : productName)".trimmingCharacters(in: .whitespaces)
    }
    var specLine: String? { OrderSpecs.line(specs) }
}

struct StorefrontOrderPage: Decodable {
    let items: [StorefrontOrderListItem]
    let total: Int
    let page: Int
    let pageSize: Int
}

struct StorefrontOrderStats: Decodable {
    let new: Int
}

/// `PATCH /storefront-orders/:id/status` body. The server owns the transition
/// rules and takes no note; only `statusCode` is sent.
nonisolated struct UpdateOrderStatusBody: Encodable {
    let statusCode: String
}
