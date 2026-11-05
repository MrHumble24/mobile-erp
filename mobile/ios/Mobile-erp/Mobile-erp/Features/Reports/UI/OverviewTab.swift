import SwiftUI

/// P&L overview: the headline list-card (NOI, revenue, COGS, gross profit,
/// expenses, returns, units — the money rows drill down), the trend chart,
/// revenue by channel, and the sales breakdown card with its own group-by.
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
            VStack(spacing: Tokens.Space.lg) {
                if let error, report == nil {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if let report {
                    MetricList(rows: rows(report))
                    FinTrendChart(title: i18n.t("reports.trendTitle"), bucket: bucket, points: trend)
                    FinBreakdownBars(title: i18n.t("reports.channelSplit"), rows: channel.map {
                        FinShareRow(key: $0.key, label: $0.label, value: reportMoney($0.revenue), share: $0.share)
                    })
                    FinSalesBreakdownCard(from: from, to: to, onBreakdown: onBreakdown)
                } else {
                    AppCard { LoadingView().frame(height: 160) }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)" }

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

    private func rows(_ r: ProfitReport) -> [MetricRow] {
        [
            MetricRow(label: i18n.t("dashboard.netOperatingIncome"), value: reportMoney(r.netOperatingIncome),
                      emphasis: moneyTint(.profit, r.netOperatingIncome), onTap: { onBreakdown(.noi(from: from, to: to)) }),
            MetricRow(label: i18n.t("dashboard.revenue"), value: reportMoney(r.revenue),
                      subtext: "\(i18n.t("dashboard.retail")) \(reportMoney(r.retail)) · \(i18n.t("dashboard.b2b")) \(reportMoney(r.b2b))"),
            MetricRow(label: i18n.t("dashboard.cogs"), value: reportMoney(r.cogs)),
            MetricRow(label: i18n.t("dashboard.grossProfit"), value: reportMoney(r.grossProfit),
                      emphasis: moneyTint(.profit, r.grossProfit), onTap: { onBreakdown(.model(from: from, to: to, measure: .grossProfit)) }),
            MetricRow(label: i18n.t("dashboard.expenses"), value: reportMoney(r.expenses), emphasis: moneyTint(.expense, r.expenses)),
            MetricRow(label: i18n.t("dashboard.returnsRefunded"), value: reportMoney(r.returnsRefunded), onTap: { onBreakdown(.returns(from: from, to: to)) }),
            MetricRow(label: i18n.t("pricing.discountsGiven"), value: reportMoney(r.discountsGiven), emphasis: moneyTint(.expense, r.discountsGiven)),
            MetricRow(label: i18n.t("dashboard.unitsSold"), value: "\(r.unitsSold)", onTap: { onBreakdown(.model(from: from, to: to, measure: .units)) }),
        ]
    }
}

/// Sales breakdown by model / channel / cashier / day inside one card: the
/// group-by segmented control, then ranked bars. Model rows drill down.
struct FinSalesBreakdownCard: View {
    let from: Date?
    let to: Date?
    let onBreakdown: (FinBreakdownRequest) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var groupBy = "model"
    @State private var rows: [FinBreakdownRow]?
    @State private var error: String?
    private let groups = ["model", "channel", "cashier", "day"]

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("reports.salesBreakdownTitle")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                SegmentedControl(selection: $groupBy, segments: groups.map { ($0, i18n.t("reports.group_\($0)")) })
                if let error, rows == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let rows {
                    if rows.isEmpty {
                        Text(i18n.t("reports.empty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                    } else {
                        FinBreakdownRows(rows: rows.map {
                            FinShareRow(key: $0.key, label: $0.label, value: reportMoney($0.revenue), share: $0.share)
                        }, onSelect: groupBy == "model" ? { key in
                            if let row = rows.first(where: { $0.key == key }) { onBreakdown(.salesRow(row)) }
                        } : nil)
                    }
                } else {
                    LoadingView().frame(height: 100)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .task(id: key) { await load() }
    }

    private var key: String { "\(from?.timeIntervalSince1970 ?? 0)-\(to?.timeIntervalSince1970 ?? 0)-\(groupBy)" }

    private func load() async {
        error = nil
        do { rows = try await ReportsRepository(api: container.api).profitBreakdown(groupBy: groupBy, from: from, to: to) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
