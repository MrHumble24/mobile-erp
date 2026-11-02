import Foundation

/// The only place that talks to `/customers/*`. All reads and writes are online
/// (customers have no offline feed).
@MainActor
struct CustomersRepository {
    let api: APIClient

    func page(search: String, hasPurchases: Bool?, sort: String,
              page: Int, pageSize: Int) async throws -> CustomerPage {
        var query: [String: String] = ["sort": sort,
                                        "page": String(page), "pageSize": String(pageSize)]
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { query["search"] = trimmed }
        if let hasPurchases { query["hasPurchases"] = hasPurchases ? "true" : "false" }
        return try await api.get("/customers", query: query)
    }

    func stats() async throws -> CustomerStats {
        try await api.get("/customers/stats")
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

    /// `PATCH /customers/:id` (needs `customer.manage`). The caller refreshes
    /// the list to pick up aggregates, so the response is not read.
    func update(_ id: String, name: String, phone: String?, notes: String?) async throws {
        try await api.patchVoid(
            "/customers/\(id)",
            body: CustomerPayload(name: name, phone: phone, notes: notes)
        )
    }
}
