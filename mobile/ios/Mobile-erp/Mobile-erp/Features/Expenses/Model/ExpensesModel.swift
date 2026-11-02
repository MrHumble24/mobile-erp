import Foundation
import Observation

/// Screen state for the expenses list: the client-only filter plus the loaded
/// list, summary and categories. One reason to change — the expenses screen.
/// All writes are online-only; the view checks connectivity before calling.
@Observable
@MainActor
final class ExpensesModel {
    // Filter (client state).
    var categoryId: String?
    var isRecurring: Bool?

    // Loaded data.
    private(set) var expenses: [Expense] = []
    private(set) var summary: ExpenseSummary?
    private(set) var categories: [ExpenseCategory] = []

    private(set) var isLoading = false
    private(set) var loadError: String?

    @ObservationIgnored private var repo: ExpensesRepository?

    func bind(_ container: AppContainer) {
        if repo == nil {
            repo = ExpensesRepository(api: container.api, baseURL: container.devConfig.baseURL)
        }
    }

    /// Initial load: categories + summary + list together.
    func load() async {
        guard let repo else { return }
        if categories.isEmpty { categories = (try? await repo.categories()) ?? [] }
        await reload()
    }

    /// Re-fetch summary + list after a filter change or a write.
    func reload() async {
        guard let repo else { return }
        isLoading = true
        loadError = nil
        do {
            async let page = repo.list(categoryId: categoryId, isRecurring: isRecurring)
            async let sum = repo.summary()
            expenses = try await page.items
            summary = try await sum
        } catch let error as AppError {
            loadError = error.message
        } catch {
            loadError = error.localizedDescription
        }
        isLoading = false
    }

    func setCategory(_ id: String?) async { categoryId = id; await reload() }
    func setRecurring(_ value: Bool?) async { isRecurring = value; await reload() }

    func create(_ dto: CreateExpenseDto) async throws {
        try await repo?.create(dto)
        await reload()
    }

    func delete(_ expense: Expense) async throws {
        try await repo?.remove(id: expense.id)
        await reload()
    }

    func addCategory(name: String) async throws {
        try await repo?.createCategory(CreateExpenseCategoryDto(name: name, description: nil))
        categories = (try? await repo?.categories()) ?? categories
    }
}
