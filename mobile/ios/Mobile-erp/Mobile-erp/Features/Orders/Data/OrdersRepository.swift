import Foundation

/// The only place that talks to `/storefront-orders` (ADR 0049, 0050). Scoped to
/// the active store by the client's `X-Store-Id` header. Online only — no outbox,
/// no cache; a status change needs the network.
@MainActor
struct OrdersRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }
    init(api: APIClient) { self.api = api }

    func list(status: String?, page: Int, pageSize: Int) async throws -> StorefrontOrderPage {
        var query: [String: String] = ["page": String(page), "pageSize": String(pageSize)]
        if let status, !status.isEmpty { query["status"] = status }
        return try await api.get("/storefront-orders", query: query)
    }

    func stats() async throws -> StorefrontOrderStats {
        try await api.get("/storefront-orders/stats")
    }

    func get(_ id: String) async throws -> StorefrontOrderDetail {
        try await api.get("/storefront-orders/\(id)")
    }

    func updateStatus(_ id: String, to statusCode: String) async throws -> StorefrontOrderDetail {
        try await api.patch("/storefront-orders/\(id)/status", body: UpdateOrderStatusBody(statusCode: statusCode))
    }
}
