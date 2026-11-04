import SwiftUI

/// Daily register closing: pick a date → that day's figures as a list-card
/// and a three-bar comparison.
struct DailyClosingTab: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var date = Date()
    @State private var report: DailyClosingReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                AppFormField(label: i18n.t("reports.selectDate")) { AppDateField(date: $date) }
                if let error, report == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let report {
                    MetricList(rows: [
                        MetricRow(label: i18n.t("dashboard.revenue"), value: reportMoney(report.revenue),
                                  subtext: "\(report.unitsSold) \(i18n.t("dashboard.unitsSold"))"),
                        MetricRow(label: i18n.t("dashboard.grossProfit"), value: reportMoney(report.grossProfit), emphasis: moneyTint(.profit, report.grossProfit)),
                        MetricRow(label: i18n.t("dashboard.expenses"), value: reportMoney(report.expenses), emphasis: moneyTint(.expense, report.expenses)),
                        MetricRow(label: i18n.t("nav.consignments"), value: "+\(report.newConsignments) / −\(report.settledConsignments)"),
                    ])
                    BarChartCard(title: i18n.t("reports.closingReport"), data: [
                        BarDatum(label: i18n.t("dashboard.revenue"), value: report.revenue),
                        BarDatum(label: i18n.t("dashboard.grossProfit"), value: report.grossProfit),
                        BarDatum(label: i18n.t("dashboard.expenses"), value: report.expenses),
                    ])
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task(id: date) { await load() }
    }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).dailyClosing(date: date) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
