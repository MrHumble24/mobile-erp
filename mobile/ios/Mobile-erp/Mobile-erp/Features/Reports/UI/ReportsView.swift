import SwiftUI

/// Financial reports, matching the web tab set: Overview · Sales · Expenses ·
/// Nasiya · Inventory · Pricing · Closing. A scrolling pill bar switches tabs;
/// the shared date-range bar applies to the first four (web parity). Tiles and
/// breakdown rows drill into a detail sheet. All reads gated by `report.finance`.
struct ReportsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var tab: FinReportTab = .overview
    @State private var range = FinReportRange()
    @State private var breakdown: FinBreakdownRequest?

    private var canViewCost: Bool { container.session.can("device.cost.view") }
    private var onBreakdown: (FinBreakdownRequest) -> Void { { breakdown = $0 } }

    var body: some View {
        VStack(spacing: 0) {
            FinTabBar(tabs: FinReportTab.allCases, selection: $tab)
            if tab.usesRange {
                FinRangeBar(range: $range)
                    .padding(.bottom, 4)
            }
            content
        }
        .navigationTitle(i18n.t("reports.title"))
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $breakdown) { FinBreakdownSheet(request: $0) }
        .task {
            #if DEBUG
            _ = FinanceSelfCheck.run
            #endif
        }
    }

    @ViewBuilder private var content: some View {
        let dates = range.dates
        switch tab {
        case .overview:
            FinOverviewTab(from: dates.from, to: dates.to, bucket: range.bucket, onBreakdown: onBreakdown)
        case .sales:
            FinSalesTab(from: dates.from, to: dates.to, onBreakdown: onBreakdown)
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
        }
    }
}

/// The seven report tabs, in web display order.
enum FinReportTab: String, CaseIterable, Identifiable {
    case overview, sales, expenses, nasiya, inventory, pricing, closing
    var id: String { rawValue }

    var labelKey: String { "reports.tab_\(rawValue)" }

    var systemImage: String {
        switch self {
        case .overview: return "chart.pie.fill"
        case .sales: return "cart.fill"
        case .expenses: return "creditcard.fill"
        case .nasiya: return "banknote.fill"
        case .inventory: return "shippingbox.fill"
        case .pricing: return "tag.fill"
        case .closing: return "lock.fill"
        }
    }

    /// The shared date range applies to overview/sales/expenses/nasiya only;
    /// inventory is a live snapshot, pricing uses a window, closing a single day.
    var usesRange: Bool {
        switch self {
        case .overview, .sales, .expenses, .nasiya: true
        case .inventory, .pricing, .closing: false
        }
    }
}
