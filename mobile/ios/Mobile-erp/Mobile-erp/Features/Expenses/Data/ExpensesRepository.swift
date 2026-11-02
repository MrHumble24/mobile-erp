import Foundation

/// The only place that talks to `/expenses` + `/expense-categories`. All reads
/// online; writes are online-only (expenses are not in the offline outbox — the
/// caller gates on connectivity first). Filters/sort/paging are passed as a
/// ready query dictionary built by the screen model.
@MainActor
struct ExpensesRepository {
    let api: APIClient

    func list(_ params: [String: String]) async throws -> ExpensePage {
        try await api.get("/expenses", query: params)
    }

    func get(id: String) async throws -> Expense {
        try await api.get("/expenses/\(id)")
    }

    func summary(from: String?, to: String?) async throws -> ExpenseSummary {
        var q: [String: String] = [:]
        if let from { q["from"] = from }
        if let to { q["to"] = to }
        return try await api.get("/expenses/summary", query: q)
    }

    func categories() async throws -> [ExpenseCategory] {
        try await api.get("/expense-categories")
    }

    func create(_ dto: CreateExpenseDto) async throws {
        _ = try await api.post("/expenses", body: dto) as Expense
    }

    func update(id: String, _ dto: UpdateExpenseDto) async throws {
        _ = try await api.patch("/expenses/\(id)", body: dto) as Expense
    }

    func remove(id: String) async throws {
        try await api.delete("/expenses/\(id)")
    }

    func createCategory(_ dto: CreateExpenseCategoryDto) async throws {
        _ = try await api.post("/expense-categories", body: dto) as ExpenseCategory
    }

    func updateCategory(id: String, _ dto: UpdateExpenseCategoryDto) async throws {
        _ = try await api.patch("/expense-categories/\(id)", body: dto) as ExpenseCategory
    }
}
