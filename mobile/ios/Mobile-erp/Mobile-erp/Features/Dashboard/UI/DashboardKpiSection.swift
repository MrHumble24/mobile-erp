import SwiftUI

/// Revenue / profit KPI rows with a today/week/month toggle (`/reports/profit`,
/// perm `report.finance`). Row order and captions match the Android `KpiSection`.
struct DashboardKpiSection: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var period: DashPeriod = .today
    @State private var profit: DashProfit?
    @State private var error: String?

    var body: some View {
        VStack(spacing: Tokens.Space.sm) {
            SegmentedControl(selection: $period, segments: [
                (.today, i18n.t("dashboard.periodToday")),
                (.week, i18n.t("dashboard.periodWeek")),
                (.month, i18n.t("dashboard.periodMonth")),
            ])

            if let error, profit == nil {
                AppCard { ErrorStateView(message: error) { Task { await load() } } }
            } else if let profit {
                DashMetricList(rows: rows(profit))
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

    private func rows(_ p: DashProfit) -> [DashMetricRow] {
        [
            DashMetricRow(label: i18n.t("dashboard.grossProfit"),
                          value: dashMoney(p.grossProfit),
                          subtext: "\(p.unitsSold) \(i18n.t("dashboard.unitsSold"))",
                          emphasis: moneyTint(.profit, p.grossProfit)),
            DashMetricRow(label: i18n.t("dashboard.netOperatingIncome"),
                          value: dashMoney(p.netOperatingIncome),
                          emphasis: moneyTint(.profit, p.netOperatingIncome)),
            DashMetricRow(label: i18n.t("dashboard.revenue"),
                          value: dashMoney(p.revenue),
                          subtext: "\(i18n.t("dashboard.retail")): \(dashMoney(p.retail))",
                          emphasis: moneyTint(.revenue, p.revenue)),
            DashMetricRow(label: i18n.t("dashboard.expenses"),
                          value: dashMoney(p.expenses),
                          emphasis: moneyTint(.expense, p.expenses)),
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
