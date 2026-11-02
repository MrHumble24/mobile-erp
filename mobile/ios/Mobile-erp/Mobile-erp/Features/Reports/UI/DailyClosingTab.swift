import SwiftUI

/// Daily register closing: pick a date → that day's units, revenue, profit,
/// expenses and consignment movement.
struct DailyClosingTab: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var date = Date()
    @State private var report: DailyClosingReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                AppCard {
                    DatePicker(i18n.t("reports.selectDate"), selection: $date,
                               in: ...Date(), displayedComponents: .date)
                }
                if let error, report == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let report {
                    MetricGrid(tiles: tiles(report))
                    BarChartCard(title: i18n.t("reports.closingReport"), data: chart(report))
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .task(id: date) { await load() }
    }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).dailyClosing(date: date) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func tiles(_ r: DailyClosingReport) -> [MetricTile] {
        [
            MetricTile(label: i18n.t("dashboard.revenue"), value: reportMoney(r.revenue),
                       subtext: "\(r.unitsSold) \(i18n.t("dashboard.unitsSold"))"),
            MetricTile(label: i18n.t("dashboard.grossProfit"), value: reportMoney(r.grossProfit)),
            MetricTile(label: i18n.t("dashboard.expenses"), value: reportMoney(r.expenses),
                       emphasis: Tokens.danger),
            MetricTile(label: i18n.t("nav.consignments"),
                       value: "+\(r.newConsignments) / -\(r.settledConsignments)"),
        ]
    }

    private func chart(_ r: DailyClosingReport) -> [BarDatum] {
        [
            BarDatum(label: i18n.t("dashboard.revenue"), value: r.revenue),
            BarDatum(label: i18n.t("dashboard.grossProfit"), value: r.grossProfit),
            BarDatum(label: i18n.t("dashboard.expenses"), value: r.expenses),
        ]
    }
}
