import Foundation
import Observation

/// Sort options for the expense list, each mapping to the server `sort`+`dir`.
enum ExpenseSort: String, CaseIterable, Identifiable {
    case newest, oldest, amountHigh, amountLow
    var id: String { rawValue }
    var labelKey: String {
        switch self {
        case .newest: "expenses.sortNewest"
        case .oldest: "expenses.sortOldest"
        case .amountHigh: "expenses.sortAmountDesc"
        case .amountLow: "expenses.sortAmountAsc"
        }
    }
    var field: String { self == .amountHigh || self == .amountLow ? "amount" : "incurredAt" }
    var dir: String { self == .oldest || self == .amountLow ? "asc" : "desc" }
}

/// Screen state for the expenses list: client-only filters plus the paginated
/// list, summary and categories. One reason to change — the expenses screen.
/// All writes are online-only; the view checks connectivity before calling.
@Observable
@MainActor
final class ExpensesModel {
    // Filters (client state).
    var search = ""
    var categoryId: String?
    var isRecurring: Bool?
    var minAmount = ""
    var maxAmount = ""
    var range = KitDateRange.all
    var sort: ExpenseSort = .newest

    // Loaded data.
    private(set) var summary: ExpenseSummary?
    private(set) var categories: [ExpenseCategory] = []
    private(set) var pager: KitPaginator<Expense>?

    @ObservationIgnored private var repo: ExpensesRepository?

    var activeCategories: [ExpenseCategory] { categories.filter(\.isActive) }

    func bind(_ container: AppContainer) {
        guard repo == nil else { return }
        let repo = ExpensesRepository(api: container.api)
        self.repo = repo
        pager = KitPaginator<Expense> { [weak self] page, size in
            guard let self else { return ([], 0) }
            var q = self.queryParams()
            q["page"] = String(page)
            q["pageSize"] = String(size)
            let resp = try await repo.list(q)
            return (resp.items, resp.total)
        }
    }

    /// Initial load: categories + first page + summary.
    func load() async {
        guard let repo else { return }
        if categories.isEmpty { categories = (try? await repo.categories()) ?? [] }
        await reload()
    }

    /// Re-fetch list + summary after a filter change or a write.
    func reload() async {
        await pager?.refresh()
        await loadSummary()
    }

    func refreshCategories() async {
        categories = (try? await repo?.categories()) ?? categories
    }

    private func loadSummary() async {
        guard let repo else { return }
        let (from, to) = isoBounds()
        summary = try? await repo.summary(from: from, to: to)
    }

    // MARK: writes

    func create(_ dto: CreateExpenseDto) async throws {
        try await repo?.create(dto)
        await reload()
    }

    func update(id: String, _ dto: UpdateExpenseDto) async throws {
        try await repo?.update(id: id, dto)
        await reload()
    }

    func delete(_ expense: Expense) async throws {
        try await repo?.remove(id: expense.id)
        await reload()
    }

    // MARK: query mapping

    private func queryParams() -> [String: String] {
        var q: [String: String] = [:]
        let (from, to) = isoBounds()
        if let from { q["from"] = from }
        if let to { q["to"] = to }
        if let categoryId { q["categoryId"] = categoryId }
        let term = search.trimmingCharacters(in: .whitespaces)
        if !term.isEmpty { q["search"] = term }
        if let min = Double(minAmount), min >= 0 { q["minAmount"] = String(min) }
        if let max = Double(maxAmount), max >= 0 { q["maxAmount"] = String(max) }
        if let isRecurring { q["isRecurring"] = isRecurring ? "true" : "false" }
        q["sort"] = sort.field
        q["dir"] = sort.dir
        return q
    }

    private func isoBounds() -> (String?, String?) {
        let cal = Calendar.current
        let iso = ISO8601DateFormatter()
        let from = range.from.map { iso.string(from: cal.startOfDay(for: $0)) }
        let to = range.to.map { date -> String in
            let end = cal.date(bySettingHour: 23, minute: 59, second: 59, of: date) ?? date
            return iso.string(from: end)
        }
        return (from, to)
    }
}
