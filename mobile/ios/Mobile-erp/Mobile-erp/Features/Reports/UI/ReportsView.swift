import SwiftUI

/// Financial reports restructured for the phone: six sections on the kit chip
/// row — P&L overview (with the sales breakdown folded in) · Expenses · Nasiya
/// · Inventory · Pricing · Closing. The period bar sits under the chips on the
/// three period sections and opens the kit filter sheet; inventory is a live
/// snapshot, pricing a rolling window, closing a single day. Tiles and rows
/// drill into a kit sheet. All reads gated by `report.finance`. Title is the
/// tab label (`nav.reports`), the same string as the Android top bar.
struct ReportsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var tab: FinReportTab = .overview
    @State private var range = FinReportRange()
    @State private var breakdown: FinBreakdownRequest?
    @State private var showFilter = false

    private var canViewCost: Bool { container.session.can("device.cost.view") }
    private var onBreakdown: (FinBreakdownRequest) -> Void { { breakdown = $0 } }

    /// The customs tab appears only for users who may read customs data.
    private var tabs: [FinReportTab] {
        FinReportTab.allCases.filter { $0 != .customs || container.session.can("customs.read") }
    }

    var body: some View {
        VStack(spacing: 0) {
            TabChips(selection: $tab, items: tabs.map { TabChipItem(value: $0, label: i18n.t($0.labelKey)) })
                .padding(.vertical, Tokens.Space.md)
            if tab.usesRange { periodBar }
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("nav.reports"))
        .sheet(item: $breakdown) { FinBreakdownSheet(request: $0) }
        .sheet(isPresented: $showFilter) { ReportFilterSheet(range: $range) }
        .task {
            #if DEBUG
            _ = FinanceSelfCheck.run
            // Screenshot helper: `-openTab overview|expenses|nasiya|inventory|pricing|closing`.
            if let raw = KitDebugLaunch.consume("openTab", accept: { FinReportTab(rawValue: $0) != nil }), let t = FinReportTab(rawValue: raw) { tab = t }
            #endif
        }
    }

    /// The active period as a one-line label beside the filter button.
    private var periodBar: some View {
        HStack(spacing: Tokens.Space.sm) {
            Text(range.label(i18n)).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
            Spacer(minLength: Tokens.Space.sm)
            Button { Haptic.tick.play(); showFilter = true } label: {
                Image(systemName: range.preset == .thirtyDay ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(Tokens.text)
                    .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(i18n.t("common.filter"))
        }
        .padding(.horizontal, Tokens.Space.gutter)
        .padding(.bottom, Tokens.Space.sm)
    }

    @ViewBuilder private var content: some View {
        let dates = range.dates
        switch tab {
        case .overview:
            FinOverviewTab(from: dates.from, to: dates.to, bucket: range.bucket, onBreakdown: onBreakdown)
        case .expenses:
            ExpensesReportTab(from: dates.from, to: dates.to)
        case .nasiya:
            FinNasiyaTab(from: dates.from, to: dates.to, onBreakdown: onBreakdown)
        case .inventory:
            FinInventoryTab(canViewCost: canViewCost, onBreakdown: onBreakdown)
        case .pricing:
            ModelPricingTab()
        case .closing:
            DailyClosingTab()
        case .customs:
            CustomsFeesTab()
        case .credit:
            CreditReportTab()
        }
    }
}

/// The report sections, in display order.
enum FinReportTab: String, CaseIterable, Identifiable {
    case overview, expenses, nasiya, inventory, pricing, closing, customs, credit
    var id: String { rawValue }
    /// Customs and credit reuse dedicated keys; the rest follow the
    /// `reports.tab_<name>` convention.
    var labelKey: String {
        switch self {
        case .customs: "reports.customsTab"
        case .credit: "credit.reportTitle"
        default: "reports.tab_\(rawValue)"
        }
    }
    /// The shared period applies to overview/expenses/nasiya only.
    var usesRange: Bool {
        switch self {
        case .overview, .expenses, .nasiya: true
        case .inventory, .pricing, .closing, .customs, .credit: false
        }
    }
}

/// Period presets as a kit `FilterSheet`; custom reveals two kit date fields.
private struct ReportFilterSheet: View {
    @Binding var range: FinReportRange
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("reports.period"),
            resetLabel: i18n.t("inventory.clearFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { range = FinReportRange(); dismiss() },
            onClose: { dismiss() }
        ) {
            AppFormField(label: i18n.t("reports.period")) {
                AppSelect(placeholder: "", selection: $range.preset, options: FinRangePreset.allCases.map { ($0, i18n.t($0.labelKey)) })
            }
            if range.preset == .custom {
                AppFormField(label: i18n.t("reports.dateFrom")) {
                    AppDateField(date: Binding(get: { range.customFrom ?? Date() }, set: { range.customFrom = $0 }))
                }
                AppFormField(label: i18n.t("reports.dateTo")) {
                    AppDateField(date: Binding(get: { range.customTo ?? Date() }, set: { range.customTo = $0 }))
                }
            }
        }
    }
}
