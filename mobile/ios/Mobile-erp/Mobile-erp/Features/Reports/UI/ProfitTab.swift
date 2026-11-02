import SwiftUI

/// Profit & Loss: date range → KPI tiles + a channel/profit breakdown chart.
struct ProfitTab: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var from = Calendar.current.date(
        from: Calendar.current.dateComponents([.year, .month], from: Date()))!
    @State private var to = Date()
    @State private var report: ProfitReport?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                DateRangeRow(from: $from, to: $to)
                if let error, report == nil {
                    ErrorStateView(message: error) { Task { await load() } }
                } else if let report {
                    heroProfitCard(report)
                    MetricGrid(tiles: tiles(report))
                    BarChartCard(title: i18n.t("dashboard.byChannel"), data: chart(report))
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .padding(16)
        }
        .background(Color(.systemGroupedBackground))
        .task(id: [from, to]) { await load() }
    }

    private func heroProfitCard(_ r: ProfitReport) -> some View {
        let isProfitable = r.netOperatingIncome >= 0
        let marginPct = r.revenue > 0 ? (r.netOperatingIncome / r.revenue) * 100 : 0

        return AppCard(
            padding: 18,
            backgroundColor: (isProfitable ? Tokens.success : Tokens.danger).opacity(0.10),
            borderColor: (isProfitable ? Tokens.success : Tokens.danger).opacity(0.35)
        ) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label(i18n.t("dashboard.netOperatingIncome", default: "Net Operating Profit"),
                          systemImage: isProfitable ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(isProfitable ? Tokens.success : Tokens.danger)
                    Spacer()
                    Text("\(String(format: "%.1f", marginPct))% \(i18n.t("dashboard.margin", default: "margin"))")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background((isProfitable ? Tokens.success : Tokens.danger).opacity(0.20),
                                    in: Capsule())
                        .foregroundStyle(isProfitable ? Tokens.success : Tokens.danger)
                }

                Text(reportMoney(r.netOperatingIncome))
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(isProfitable ? Tokens.success : Tokens.danger)
                    .monospacedDigit()

                Text(i18n.t("reports.netProfitDesc", default: "Net earnings after cost of goods sold, operating overhead, and customer refunds."))
                    .font(.caption)
                    .foregroundStyle(Tokens.ink.opacity(0.75))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func load() async {
        error = nil
        do { report = try await ReportsRepository(api: container.api).profit(from: from, to: to) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func tiles(_ r: ProfitReport) -> [MetricTile] {
        [
            MetricTile(label: i18n.t("dashboard.revenue"), value: reportMoney(r.revenue),
                       subtext: "\(i18n.t("dashboard.retail")): \(reportMoney(r.retail)) · \(i18n.t("dashboard.b2b")): \(reportMoney(r.b2b))"),
            MetricTile(label: i18n.t("dashboard.cogs"), value: reportMoney(r.cogs),
                       subtext: "\(r.unitsSold) \(i18n.t("dashboard.unitsSold"))"),
            MetricTile(label: i18n.t("dashboard.grossProfit"), value: reportMoney(r.grossProfit)),
            MetricTile(label: i18n.t("dashboard.expenses"), value: reportMoney(r.expenses),
                       emphasis: Tokens.danger),
            MetricTile(label: i18n.t("dashboard.returnsRefunded"),
                       value: reportMoney(r.returnsRefunded)),
        ]
    }

    private func chart(_ r: ProfitReport) -> [BarDatum] {
        [
            BarDatum(label: i18n.t("dashboard.retail"), value: r.retail),
            BarDatum(label: i18n.t("dashboard.b2b"), value: r.b2b),
            BarDatum(label: i18n.t("dashboard.grossProfit"), value: r.grossProfit),
            BarDatum(label: i18n.t("dashboard.netOperatingIncome"), value: r.netOperatingIncome),
        ]
    }
}

/// From/to date fields shared by the report tabs (stock `DatePicker`s).
struct DateRangeRow: View {
    @Binding var from: Date
    @Binding var to: Date
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard(padding: 14) {
            VStack(spacing: 8) {
                DatePicker(i18n.t("reports.dateFrom"), selection: $from,
                           in: ...to, displayedComponents: .date)
                Divider()
                DatePicker(i18n.t("reports.dateTo"), selection: $to,
                           in: from...Date(), displayedComponents: .date)
            }
        }
    }
}
