import SwiftUI

/// Revenue / profit KPI tiles with a today/week/month toggle (`/reports/profit`,
/// perm `report.finance`).
struct DashboardKpiSection: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var period: DashPeriod = .today
    @State private var profit: DashProfit?
    @State private var error: String?

    var body: some View {
        VStack(spacing: 12) {
            Picker(i18n.t("reports.period"), selection: $period) {
                Text(i18n.t("dashboard.periodToday")).tag(DashPeriod.today)
                Text(i18n.t("dashboard.periodWeek")).tag(DashPeriod.week)
                Text(i18n.t("dashboard.periodMonth")).tag(DashPeriod.month)
            }
            .pickerStyle(.segmented)

            if let error, profit == nil {
                AppCard { ErrorStateView(message: error) { Task { await load() } } }
            } else if let profit {
                DashTileGrid(tiles: tiles(profit))
            } else {
                AppCard { LoadingView().frame(height: 80) }
            }
        }
        .task(id: period) { await load() }
    }

    private func load() async {
        error = nil
        let range = period.range
        do {
            profit = try await DashboardRepository(api: container.api)
                .profit(from: range.from, to: range.to)
        } catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func tiles(_ p: DashProfit) -> [DashTile] {
        [
            DashTile(label: i18n.t("dashboard.netOperatingIncome", default: "Net Operating Profit"),
                     value: dashMoney(p.netOperatingIncome),
                     subtext: i18n.t("dashboard.netProfitSubtitle", default: "Store profit after operating expenses"),
                     emphasis: Tokens.success),
            DashTile(label: i18n.t("dashboard.revenue", default: "Total Sales Revenue"),
                     value: dashMoney(p.revenue),
                     subtext: "\(p.unitsSold) \(i18n.t("dashboard.unitsSold", default: "units sold")) · \(dashMoney(p.retail)) \(i18n.t("dashboard.retail", default: "retail"))"),
            DashTile(label: i18n.t("dashboard.grossProfit", default: "Gross Sales Profit"),
                     value: dashMoney(p.grossProfit),
                     subtext: i18n.t("dashboard.grossProfitSubtitle", default: "Revenue minus phone unit costs")),
            DashTile(label: i18n.t("dashboard.expenses", default: "Operating Expenses"),
                     value: dashMoney(p.expenses),
                     subtext: i18n.t("dashboard.expensesSubtitle", default: "Rent, bills, and shop overhead"),
                     emphasis: Tokens.danger),
        ]
    }
}

enum DashPeriod: Hashable {
    case today, week, month

    var range: (from: Date, to: Date) {
        let cal = Calendar.current
        let now = Date()
        let from: Date
        switch self {
        case .today: from = cal.startOfDay(for: now)
        case .week:
            from = cal.date(from: cal.dateComponents(
                [.yearForWeekOfYear, .weekOfYear], from: now)) ?? cal.startOfDay(for: now)
        case .month:
            from = cal.date(from: cal.dateComponents([.year, .month], from: now)) ?? now
        }
        // Upper bound is end of today (start of tomorrow), not `now`: the data is
        // identical (nothing happens in the future) but the URL stays stable within
        // the day, so the offline response cache can serve it on the next launch.
        let to = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: now)) ?? now
        return (from, to)
    }
}
