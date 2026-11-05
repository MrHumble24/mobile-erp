import Foundation

/// All data access for customer credit (ADR 0035). Credit is **online only** —
/// there is no outbox path — so every call goes straight to the API. Mirrors the
/// web `creditRepository`.
@MainActor
struct CreditRepository {
    let api: APIClient

    init(_ container: AppContainer) { self.api = container.api }
    init(api: APIClient) { self.api = api }

    func list(customerId: String? = nil, status: CreditStatusFilter = .all) async throws -> [CreditListItem] {
        var query: [String: String] = [:]
        if let customerId, !customerId.isEmpty { query["customerId"] = customerId }
        if let s = status.query { query["status"] = s }
        return try await api.get("/credits", query: query)
    }

    func get(_ id: String) async throws -> CreditView { try await api.get("/credits/\(id)") }

    /// The customer's credit position for the till sheet (limit guard + summary).
    func customer(_ id: String) async throws -> CreditCustomer {
        try await api.get("/customers/\(id)")
    }

    func contract(_ id: String) async throws -> CreditContract {
        try await api.get("/credits/\(id)/contract")
    }

    func report() async throws -> CreditReport { try await api.get("/credits/report") }

    func create(_ payload: CreateCreditPayload) async throws -> CreditView {
        try await api.post("/credits", body: payload)
    }

    func addPayment(_ id: String, _ payload: CreditPaymentPayload) async throws -> CreditView {
        try await api.post("/credits/\(id)/payments", body: payload)
    }

    func refund(_ id: String, _ payload: CreditPaymentPayload) async throws -> CreditView {
        try await api.post("/credits/\(id)/refund", body: payload)
    }
}
