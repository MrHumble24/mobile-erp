import SwiftUI

/// Expense list: the system search bar, filter + new + CSV in the toolbar,
/// the summary list-card (period total, count, per-category breakdown), then
/// one card per expense. Rows open the detail sheet, which carries edit /
/// delete for `expense.manage`.
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
    private var hasActiveFilters: Bool {
        model.categoryId != nil || model.isRecurring != nil ||
        !model.minAmount.isEmpty || !model.maxAmount.isEmpty || model.range != .all || model.sort != .newest
    }

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let summary = model.summary { self.summary(summary) }
                listBody
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .searchable(text: $model.search, prompt: i18n.t("expenses.searchPlaceholder"))
        .onSubmit(of: .search) { Task { await model.reload() } }
        .refreshable { await model.reload() }
        .toolbar { toolbar }
        .sheet(isPresented: $showFilters) { ExpenseFiltersSheet(model: model) }
        .sheet(isPresented: $showLog) { LogExpenseSheet(model: model, expense: editing) { toast($0) } }
        .sheet(item: $detail) { target in
            ExpenseDetailSheet(id: target.id, canManage: canManage,
                               onEdit: { expense in detail = nil; editing = expense; showLog = true },
                               onDelete: { expense in detail = nil; pendingDelete = expense })
        }
        .confirmationDialog(
            i18n.t("expenses.deleteConfirm"),
            isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
            presenting: pendingDelete
        ) { expense in
            Button(i18n.t("common.delete"), role: .destructive) { delete(expense) }
        }
        #if DEBUG
        // Screenshot helper: `-openExpense first` opens the first row's detail.
        .onChange(of: model.pager?.items.count ?? 0) { _, count in
            guard count > 0, detail == nil, KitDebugLaunch.consume("openExpense") == "first" else { return }
            detail = model.pager?.items.first.map { DetailTarget(id: $0.id) }
        }
        #endif
    }

    private func summary(_ s: ExpenseSummary) -> some View {
        MetricList(rows: [
            MetricRow(label: i18n.t("expenses.metricTotal"), value: MoneyText.format(String(s.total))),
            MetricRow(label: i18n.t("expenses.metricCount"), value: "\(s.count)"),
        ] + s.byCategory.map { MetricRow(label: $0.name, value: MoneyText.format(String($0.total))) })
    }

    @ViewBuilder private var listBody: some View {
        if let error = model.pager?.error, items.isEmpty {
            AppCard { ErrorStateView(message: error) { Task { await model.reload() } } }
        } else if items.isEmpty {
            if model.pager?.isLoading ?? true {
                AppCard { LoadingView().frame(height: 120) }
            } else {
                AppCard { EmptyStateView(systemImage: "receipt", title: i18n.t("expenses.noExpensesFound")) }
            }
        } else {
            ForEach(items) { expense in
                ExpenseRow(expense: expense) { detail = DetailTarget(id: expense.id) }
            }
            if let pager = model.pager { KitLoadMoreFooter(pager: pager) }
        }
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { Haptic.tick.play(); showFilters = true } label: {
                Label(i18n.t("common.filter"),
                      systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
            }
        }
        if canManage {
            ToolbarItem(placement: .primaryAction) {
                Button { editing = nil; showLog = true } label: {
                    Label(i18n.t("expenses.newExpense"), systemImage: "plus")
                }
            }
        }
        if !items.isEmpty {
            ToolbarItem(placement: .secondaryAction) {
                KitCSVShareButton(filename: "expenses.csv", label: i18n.t("expenses.exportCsv"), build: csv)
            }
        }
    }

    private func csv() -> String {
        KitCSV.build(
            headers: [i18n.t("expenses.incurredAt"), i18n.t("expenses.category"), i18n.t("expenses.description"),
                      i18n.t("expenses.vendor"), i18n.t("expenses.amount"), i18n.t("expenses.isRecurring"), i18n.t("expenses.recordedBy")],
            rows: items.map { e in
                [String(e.incurredAt.prefix(10)), e.categoryName, e.description ?? "", e.vendor ?? "", e.amount,
                 i18n.t(e.isRecurring ? "common.yes" : "common.no"), e.createdBy?.displayName ?? ""]
            }
        )
    }

    private func toast(_ message: String) { container.toasts.info(message) }

    private func delete(_ expense: Expense) {
        pendingDelete = nil
        guard container.connectivity.isOnline else { toast(i18n.t("common.offline")); return }
        Task {
            do { try await model.delete(expense); toast(i18n.t("expenses.expenseDeleted")) }
            catch let e as AppError { toast(e.message) }
            catch { toast(error.localizedDescription) }
        }
    }
}

/// One expense card: category, mono date, description and a recurring pill
/// left; the mono amount right.
private struct ExpenseRow: View {
    let expense: Expense
    var onOpen: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(expense.categoryName).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Text(KitDate.day(expense.incurredAt)).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    if let d = expense.description, !d.isEmpty {
                        Text(d).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    if expense.isRecurring {
                        StatusBadge(i18n.t("expenses.tabRecurring"), color: Tokens.info).padding(.top, 2)
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                MoneyText(value: expense.amount, size: 15).fontWeight(.semibold).foregroundStyle(Tokens.text)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onOpen)
    }
}
