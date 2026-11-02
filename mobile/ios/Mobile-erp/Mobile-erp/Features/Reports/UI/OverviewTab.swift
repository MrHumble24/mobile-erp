import SwiftUI

/// P&L overview: KPI tiles (gross profit / units / NOI / returns drill down), a
/// revenue·profit·expense trend chart and a revenue-by-channel breakdown.
struct FinOverviewTab: View {
    let from: Date?
    let to: Date?
    let bucket: String
    let onBreakdown: (FinBreakdownRequest) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var report: ProfitReport?
    @State private var trend: [TrendPoint] = []
    @State private var channel: [FinBreakdownRow] = []
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error, report == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let report {
                    MetricGrid(tiles: tiles(report))
                    FinTrendChart(title: i18n.t("reports.trendTitle"), points: trend)
                    channelCard
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)" }

    @ViewBuilder private var channelCard: some View {
        let rows = channel.map {
            FinShareRow(key: $0.key, label: $0.label, value: reportMoney($0.revenue), share: $0.share)
        }
        BarChartCard(
            title: i18n.t("reports.channelSplit"),
            data: channel.map { BarDatum(label: $0.label, value: $0.revenue) }
        )
        if !rows.isEmpty { FinShareList(rows: rows) }
    }

    private func load() async {
        error = nil
        let repo = ReportsRepository(api: container.api)
        async let profit = repo.profit(from: from, to: to)
        async let trendRows = repo.trend(from: from, to: to, bucket: bucket)
        async let channelRows = repo.profitBreakdown(groupBy: "channel", from: from, to: to)
        do {
            report = try await profit
            trend = (try? await trendRows) ?? []
            channel = (try? await channelRows) ?? []
        } catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func tiles(_ r: ProfitReport) -> [MetricTile] {
        [
            MetricTile(label: i18n.t("dashboard.revenue"), value: reportMoney(r.revenue),
                       subtext: "\(i18n.t("dashboard.retail")): \(reportMoney(r.retail))"),
            MetricTile(label: i18n.t("dashboard.cogs"), value: reportMoney(r.cogs),
                       subtext: "\(r.unitsSold) \(i18n.t("dashboard.unitsSold"))"),
            MetricTile(label: i18n.t("dashboard.grossProfit"), value: reportMoney(r.grossProfit),
                       onTap: { onBreakdown(.model(from: from, to: to, measure: .grossProfit)) }),
            MetricTile(label: i18n.t("dashboard.expenses"), value: reportMoney(r.expenses),
                       emphasis: Tokens.danger),
            MetricTile(label: i18n.t("dashboard.netOperatingIncome"),
                       value: reportMoney(r.netOperatingIncome), emphasis: Tokens.success,
                       onTap: { onBreakdown(.noi(from: from, to: to)) }),
            MetricTile(label: i18n.t("dashboard.returnsRefunded"), value: reportMoney(r.returnsRefunded),
                       onTap: { onBreakdown(.returns(from: from, to: to)) }),
            MetricTile(label: i18n.t("dashboard.unitsSold"), value: "\(r.unitsSold)",
                       onTap: { onBreakdown(.model(from: from, to: to, measure: .units)) }),
        ]
    }
}
