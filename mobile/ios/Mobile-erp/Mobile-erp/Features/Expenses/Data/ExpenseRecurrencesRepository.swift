import Foundation

/// The only caller of `/expense-recurrences`. All online; writes gated on
/// connectivity by the view (recurrences are not offline-queueable).
@MainActor
struct ExpenseRecurrencesRepository {
    let api: APIClient

    func list() async throws -> [ExpenseRecurrence] {
        try await api.get("/expense-recurrences")
    }

    func create(_ dto: CreateExpenseRecurrenceDto) async throws {
        _ = try await api.post("/expense-recurrences", body: dto) as ExpenseRecurrence
    }

    func update(id: String, _ dto: UpdateExpenseRecurrenceDto) async throws {
        _ = try await api.patch("/expense-recurrences/\(id)", body: dto) as ExpenseRecurrence
    }

    func generateDue() async throws -> GenerateDueResult {
        try await api.post("/expense-recurrences/generate", body: EmptyBody())
    }
}

/// Empty JSON body for the parameterless generate endpoint.
private struct EmptyBody: Encodable {}
