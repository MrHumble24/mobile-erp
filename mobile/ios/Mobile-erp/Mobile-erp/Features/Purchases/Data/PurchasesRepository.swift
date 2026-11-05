import Foundation

/// The only place that talks to `/customer-purchases` + the buy-sheet catalog
/// (ADR 0039). Buying a phone is **online only** — there is no outbox path, so
/// every call goes straight to the API.
@MainActor
struct PurchasesRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }
    init(api: APIClient) { self.api = api }

    /// `GET /customer-purchases?from&to&customerId&search&page&pageSize`.
    func list(from: Date?, to: Date?, search: String, page: Int, pageSize: Int) async throws -> CustomerPurchasePage {
        var query: [String: String] = ["page": String(page), "pageSize": String(pageSize)]
        if let from { query["from"] = ISO8601DateFormatter().string(from: from) }
        if let to { query["to"] = ISO8601DateFormatter().string(from: to) }
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { query["search"] = trimmed }
        return try await api.get("/customer-purchases", query: query)
    }

    func get(_ id: String) async throws -> CustomerPurchaseView {
        try await api.get("/customer-purchases/\(id)")
    }

    func create(_ payload: BuyPhonePayload) async throws -> CustomerPurchaseView {
        try await api.post("/customer-purchases", body: payload)
    }

    /// Buy-sheet product catalog: IMEI / SERIAL models only (QUANTITY can't be a
    /// stocked unit). Reads `/device-models` (perm `device.read`).
    func sellableModels() async throws -> [PurchaseModel] {
        let models: [PurchaseModel] = try await api.get("/device-models")
        return models.filter { !$0.isQuantity }
    }
}
