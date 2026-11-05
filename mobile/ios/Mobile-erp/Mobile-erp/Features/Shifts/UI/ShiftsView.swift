import SwiftUI

/// Shifts list (ADR 0036): newest first, a date-range filter, and a cashier
/// filter for `shift.manage`. Tap a row for its report (where a manager can
/// force-close an open shift). Online only.
struct ShiftsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = ShiftsListModel()
    @State private var showFilter = false
    @State private var cashiers: [ShiftCashier] = []
    @State private var report: ShiftReportView?

    var body: some View {
        content
            .background(Tokens.ground)
            .navigationTitle(i18n.t("shifts.title"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showFilter = true } label: { Image(systemName: "line.3.horizontal.decrease.circle") }
                }
            }
            .sheet(isPresented: $showFilter) {
                ShiftsFilterSheet(model: model, cashiers: cashiers) { model.reload() }
            }
            .appSheet(item: $report) { r in
                ShiftReportSheet(report: r, canManage: model.canManage) { model.reload() }
            }
            .task {
                model.configure(container)
                #if DEBUG
                _ = ShiftMathSelfCheck.ran
                #endif
                if model.pager?.items.isEmpty ?? true { model.reload() }
                if model.canManage, cashiers.isEmpty {
                    cashiers = (try? await ShiftRepository(container).cashiers()) ?? []
                }
            }
            #if DEBUG
            // Screenshot helper: `-openShift first` opens the first shift's report.
            .onChange(of: model.pager?.items.count ?? 0) { _, count in
                if count > 0, KitDebugLaunch.consume("openShift") != nil, let first = model.pager?.items.first {
                    openReport(first)
                }
            }
            #endif
    }

    @ViewBuilder private var content: some View {
        if let pager = model.pager {
            if model.offline {
                EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline"))
            } else if pager.items.isEmpty && pager.isLoading {
                LoadingView()
            } else if pager.items.isEmpty {
                EmptyStateView(systemImage: "clock", title: i18n.t("shifts.noShifts"))
            } else {
                ScrollView {
                    VStack(spacing: Tokens.Space.md) {
                        ForEach(pager.items) { item in
                            Button { openReport(item) } label: { ShiftRow(item: item) }
                                .buttonStyle(.plain)
                        }
                        KitLoadMoreFooter(pager: pager)
                    }
                    .padding(.horizontal, Tokens.Space.gutter)
                    .padding(.vertical, Tokens.Space.md)
                }
                .refreshable { model.reload() }
            }
        } else {
            LoadingView()
        }
    }

    private func openReport(_ item: ShiftListItem) {
        Task { report = try? await ShiftRepository(container).report(item.id) }
    }
}

/// One shift row: cashier, opened → closed (or still open), and the difference.
private struct ShiftRow: View {
    let item: ShiftListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .center, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.cashier.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                    Text(KitDate.dayTime(item.openedAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    if item.isOpen { StatusBadge(i18n.t("shifts.stillOpen"), color: Tokens.warning) }
                }
                Spacer(minLength: Tokens.Space.sm)
                if let diff = item.difference, (Decimal(string: diff) ?? 0) != 0 {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(i18n.t("shifts.difference")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        MoneyText(value: diff, size: 15)
                            .foregroundStyle((Decimal(string: diff) ?? 0) < 0 ? Tokens.danger : Tokens.warning)
                    }
                }
            }
        }
    }
}

/// Date range + (for `shift.manage`) a cashier filter.
private struct ShiftsFilterSheet: View {
    @Bindable var model: ShiftsListModel
    let cashiers: [ShiftCashier]
    let onApply: () -> Void
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("shifts.title"),
            resetLabel: i18n.t("inventory.clearFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { model.filters = ShiftListFilters(); onApply(); dismiss() },
            onClose: { onApply(); dismiss() }
        ) {
            if model.canManage {
                AppFormField(label: i18n.t("shifts.cashier")) {
                    AppSelect(placeholder: i18n.t("shifts.allShifts"),
                              selection: Binding(get: { model.filters.cashierId ?? "" },
                                                 set: { model.filters.cashierId = $0.isEmpty ? nil : $0 }),
                              options: [("", i18n.t("shifts.allShifts"))] + cashiers.map { ($0.id, $0.name) })
                }
            }
            AppFormField(label: i18n.t("reports.dateFrom")) {
                AppDateField(date: Binding(get: { model.filters.from ?? Date() }, set: { model.filters.from = $0 }))
            }
            AppFormField(label: i18n.t("reports.dateTo")) {
                AppDateField(date: Binding(get: { model.filters.to ?? Date() }, set: { model.filters.to = $0 }))
            }
        }
    }
}
