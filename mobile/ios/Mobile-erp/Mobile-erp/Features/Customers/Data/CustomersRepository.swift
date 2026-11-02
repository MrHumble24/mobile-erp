import Foundation

/// The only place that talks to `/customers/*`. All reads and writes are online
/// (customers have no offline feed).
///
/// Note: editing a customer is `PATCH /customers/:id`, but the foundation
/// `APIClient` exposes only GET/POST — so edit is deferred (see slice README),
/// not faked as a POST to a PATCH route.
@MainActor
struct CustomersRepository {
    let api: APIClient

    func page(search: String, hasPurchases: Bool?, sort: String) async throws -> CustomerPage {
        var query: [String: String] = ["sort": sort]
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { query["search"] = trimmed }
        if let hasPurchases { query["hasPurchases"] = hasPurchases ? "true" : "false" }
        return try await api.get("/customers", query: query)
    }

    func sales(_ id: String) async throws -> [CustomerSale] {
        try await api.get("/customers/\(id)/sales")
    }

    /// `POST /customers`. The response is a bare `CustomerView`; the caller
    /// refreshes the list to pick up aggregates.
    func create(name: String, phone: String?, notes: String?) async throws {
        struct Created: Decodable { let id: String }
        let _: Created = try await api.post(
            "/customers",
            body: CustomerPayload(name: name, phone: phone, notes: notes)
        )
    }
}
