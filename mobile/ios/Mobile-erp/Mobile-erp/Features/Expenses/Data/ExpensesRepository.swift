import Foundation

/// The only place that talks to `/expenses` + `/expense-categories`. All reads
/// online; writes are online-only (expenses are not in the offline outbox — the
/// caller gates on connectivity first).
@MainActor
struct ExpensesRepository {
    let api: APIClient
    /// Live base URL, for the DELETE workaround (`APIClient` has no DELETE).
    let baseURL: URL

    func list(categoryId: String?, isRecurring: Bool?) async throws -> ExpensePage {
        var q = ["page": "1", "pageSize": "100"]
        if let categoryId { q["categoryId"] = categoryId }
        if let isRecurring { q["isRecurring"] = isRecurring ? "true" : "false" }
        return try await api.get("/expenses", query: q)
    }

    func summary() async throws -> ExpenseSummary {
        try await api.get("/expenses/summary")
    }

    func categories() async throws -> [ExpenseCategory] {
        try await api.get("/expense-categories")
    }

    func create(_ dto: CreateExpenseDto) async throws {
        _ = try await api.post("/expenses", body: dto) as Expense
    }

    func remove(id: String) async throws {
        try await AuthedHTTP.delete("/expenses/\(id)", baseURL: baseURL)
    }

    func createCategory(_ dto: CreateExpenseCategoryDto) async throws {
        _ = try await api.post("/expense-categories", body: dto) as ExpenseCategory
    }
}
