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

    func bonus(_ id: String) async throws -> BonusView {
        try await api.get("/customers/\(id)/bonus")
    }

    func adjustBonus(customerId: String, amount: Double, reason: String) async throws -> BonusView {
        struct AdjustBody: Encodable {
            let amount: Double
            let reason: String
        }
        return try await api.post("/customers/\(customerId)/bonus/adjustments", body: AdjustBody(amount: amount, reason: reason))
    }

    /// `POST /customers`. A JSON body so a blank phone/notes/credit limit is sent
    /// as explicit null (the credit limit then uses the shop default, ADR 0035).
    func create(name: String, phone: String?, notes: String?,
                priceLevelCode: String, standingDiscountPercent: Double,
                creditLimit: Double?) async throws {
        _ = try await api.postJSON("/customers",
                                   body: Self.body(name: name, phone: phone, notes: notes,
                                                   priceLevelCode: priceLevelCode,
                                                   standingDiscountPercent: standingDiscountPercent,
                                                   creditLimit: creditLimit))
    }

    /// `PATCH /customers/:id` (needs `customer.manage`). JSON body, as `create`,
    /// so a blank credit limit clears back to the shop default.
    func update(_ id: String, name: String, phone: String?, notes: String?,
                priceLevelCode: String, standingDiscountPercent: Double,
                creditLimit: Double?) async throws {
        try await api.patchJSONVoid("/customers/\(id)",
                                    Self.body(name: name, phone: phone, notes: notes,
                                              priceLevelCode: priceLevelCode,
                                              standingDiscountPercent: standingDiscountPercent,
                                              creditLimit: creditLimit))
    }

    /// The write body: blanks become explicit JSON null so a field can be cleared.
    private static func body(name: String, phone: String?, notes: String?,
                             priceLevelCode: String, standingDiscountPercent: Double,
                             creditLimit: Double?) -> [String: Any] {
        [
            "name": name,
            "phone": phone.map { $0 as Any } ?? NSNull(),
            "notes": notes.map { $0 as Any } ?? NSNull(),
            "priceLevelCode": priceLevelCode,
            "standingDiscountPercent": standingDiscountPercent,
            "creditLimit": creditLimit.map { $0 as Any } ?? NSNull(),
        ]
    }
}
