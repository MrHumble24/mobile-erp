import SwiftUI

/// Expense list: summary, filters, paginated rows with load-more, CSV export,
/// row detail and (with `expense.manage`) log / edit / delete.
struct ExpensesListTab: View {
    let model: ExpensesModel
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var showFilters = false
    @State private var showLog = false
    @State private var editing: Expense?
    @State private var detail: DetailTarget?
    @State private var pendingDelete: Expense?

    private struct DetailTarget: Identifiable { let id: String }

    private var canManage: Bool { container.session.can("expense.manage") }
    private var items: [Expense] { model.pager?.items ?? [] }

    var body: some View {
        List {
            if let summary = model.summary {
                Section { ExpensesSummaryCard(summary: summary) }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
            }
            listBody
        }
        .listStyle(.insetGrouped)
        .refreshable { await model.reload() }
        .toolbar { toolbar }
        .sheet(isPresented: $showFilters) { ExpenseFiltersSheet(model: model) }
        .sheet(isPresented: $showLog) {
            LogExpenseSheet(model: model, expense: editing) { toast($0) }
        }
        .sheet(item: $detail) { target in
            ExpenseDetailSheet(id: target.id, canManage: canManage) { expense in
                detail = nil; editing = expense; showLog = true
            }
        }
        .confirmationDialog(
            i18n.t("expenses.deleteConfirm"),
            isPresented: Binding(get: { pendingDelete != nil },
                                 set: { if !$0 { pendingDelete = nil } }),
            presenting: pendingDelete
        ) { expense in
            Button(i18n.t("common.delete"), role: .destructive) { delete(expense) }
        }
    }

    @ViewBuilder private var listBody: some View {
        if let error = model.pager?.error, items.isEmpty {
            Section { ErrorStateView(message: error) { Task { await model.reload() } } }
        } else if items.isEmpty && !(model.pager?.isLoading ?? false) {
            Section {
                EmptyStateView(systemImage: "receipt", title: i18n.t("expenses.noExpensesFound"))
            }
        } else {
            Section {
                ForEach(items) { expense in
                    Button { detail = DetailTarget(id: expense.id) } label: { ExpenseRow(expense: expense, i18n: i18n) }
                        .buttonStyle(.plain)
                        .swipeActions {
                            if canManage {
                                Button(i18n.t("common.delete"), role: .destructive) {
                                    pendingDelete = expense
                                }
                                Button(i18n.t("common.edit")) { editing = expense; showLog = true }
                                    .tint(Tokens.signalBlue)
                            }
                        }
                }
                if let pager = model.pager { KitLoadMoreFooter(pager: pager) }
            }
        }
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { showFilters = true } label: { Image(systemName: "line.3.horizontal.decrease.circle") }
                .accessibilityLabel(i18n.t("common.filter"))
        }
        ToolbarItem(placement: .topBarTrailing) {
            KitCSVShareButton(filename: "expenses.csv",
                              label: i18n.t("expenses.exportCsv"),
                              build: csv).labelStyle(.iconOnly)
        }
        if canManage {
            ToolbarItem(placement: .topBarTrailing) {
                Button { editing = nil; showLog = true } label: { Image(systemName: "plus") }
                    .accessibilityLabel(i18n.t("expenses.newExpense"))
            }
        }
    }

    private func csv() -> String {
        KitCSV.build(
            headers: ["Date", "Category", "Description", "Vendor", "Amount", "Recurring", "Recorded By"],
            rows: items.map { e in
                [String(e.incurredAt.prefix(10)), e.categoryName, e.description ?? "",
                 e.vendor ?? "", e.amount, e.isRecurring ? "Yes" : "No", e.createdBy?.displayName ?? ""]
            }
        )
    }

    private func toast(_ message: String) { container.toasts.info(message) }

    private func delete(_ expense: Expense) {
        pendingDelete = nil
        guard container.connectivity.isOnline else {
            toast(i18n.t("common.offline", default: "No connection — reconnect to delete."))
            return
        }
        Task {
            do { try await model.delete(expense); toast(i18n.t("expenses.expenseDeleted")) }
            catch let e as AppError { toast(e.message) }
            catch { toast(error.localizedDescription) }
        }
    }
}

/// One expense list row: category (+ recurring chip), date, description, amount.
private struct ExpenseRow: View {
    let expense: Expense
    let i18n: I18n

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(expense.categoryName)
                        .font(.body.weight(.medium))
                        .foregroundStyle(Tokens.ink)
                    if expense.isRecurring {
                        StatusBadge(i18n.t("expenses.isRecurring", default: "Recurring"), color: Tokens.signalBlue)
                    }
                }
                Text(ExpenseDate.display(expense.incurredAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let d = expense.description, !d.isEmpty {
                    Text(d)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            MoneyText(value: expense.amount, size: 16)
                .foregroundStyle(Tokens.ink)
        }
        .padding(.vertical, 4)
    }
}
