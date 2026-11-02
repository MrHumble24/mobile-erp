import SwiftUI

/// Shop expenses: a summary card, category/recurring filters and the expense
/// list. Log-expense and manage-categories actions live in the toolbar, both
/// online-only and gated by permission codes.
struct ExpensesView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var model = ExpensesModel()
    @State private var showLog = false
    @State private var showCategories = false
    @State private var showFilters = false
    @State private var pendingDelete: Expense?
    @State private var toast: String?

    private var canManage: Bool { container.session.can("expense.manage") }

    private var hasActiveFilters: Bool {
        model.categoryId != nil || model.isRecurring != nil
    }

    var body: some View {
        List {
            expensesSection
        }
        .navigationTitle(i18n.t("expenses.title"))
        .toolbar { toolbar }
        .refreshable { await model.reload() }
        .task {
            model.bind(container)
            if model.summary == nil { await model.load() }
        }
        .sheet(isPresented: $showFilters) {
            ExpensesFilterSheet(model: model)
        }
        .sheet(isPresented: $showLog) {
            LogExpenseSheet(model: model) { toast = $0 }
        }
        .sheet(isPresented: $showCategories) {
            ExpenseCategoriesSheet(model: model) { toast = $0 }
        }
        .confirmationDialog(
            i18n.t("expenses.deleteConfirm", default: "Delete this expense?"),
            isPresented: Binding(get: { pendingDelete != nil },
                                 set: { if !$0 { pendingDelete = nil } }),
            presenting: pendingDelete
        ) { expense in
            Button(i18n.t("common.delete"), role: .destructive) { delete(expense) }
        }
        .overlay(alignment: .bottom) { ToastView(message: $toast) }
    }

    @ViewBuilder private var expensesSection: some View {
        if let error = model.loadError, model.expenses.isEmpty {
            Section { ErrorStateView(message: error) { Task { await model.reload() } } }
        } else if model.expenses.isEmpty && !model.isLoading {
            Section {
                EmptyStateView(systemImage: "receipt",
                               title: i18n.t("expenses.noExpensesFound"))
            }
        } else {
            Section(i18n.t("nav.expenses")) {
                ForEach(model.expenses) { expense in
                    ExpenseRow(expense: expense, i18n: i18n)
                        .swipeActions {
                            if canManage {
                                Button(i18n.t("common.delete"), role: .destructive) {
                                    pendingDelete = expense
                                }
                            }
                        }
                }
            }
        }
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                showFilters = true
            } label: {
                Label(i18n.t("common.filter", default: "Filters & Overview"),
                      systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                showCategories = true
            } label: { Image(systemName: "folder") }
            .accessibilityLabel(i18n.t("expenses.categories"))
        }
        if canManage {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showLog = true
                } label: { Image(systemName: "plus") }
                .accessibilityLabel(i18n.t("expenses.newExpense"))
            }
        }
    }

    private func delete(_ expense: Expense) {
        pendingDelete = nil
        guard container.connectivity.isOnline else {
            toast = i18n.t("common.offline", default: "No connection — reconnect to delete.")
            return
        }
        Task {
            do { try await model.delete(expense); toast = i18n.t("expenses.expenseDeleted") }
            catch let e as AppError { toast = e.message }
            catch { toast = error.localizedDescription }
        }
    }
}

/// One expense list row: date, category (with a recurring chip), amount.
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
