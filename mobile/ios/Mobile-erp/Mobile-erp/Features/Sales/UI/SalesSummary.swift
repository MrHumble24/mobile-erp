import SwiftUI

/// Summary rows from `/sales/stats` — count, revenue, average price, returns
/// (with refunded caption) and net profit tinted by sign (shown only when the
/// server included it). One shared `MetricList`, the same card Android draws.
struct SalesSummary: View {
    let stats: SaleStatsView
    @Environment(I18n.self) private var i18n

    var body: some View {
        var rows = [
            MetricRow(label: i18n.t("sales.statsCount"), value: "\(stats.count)"),
            MetricRow(label: i18n.t("sales.statsRevenue"), value: MoneyText.format(stats.revenue.string)),
            MetricRow(label: i18n.t("sales.statsAvgPrice"), value: MoneyText.format(stats.avgPrice.string)),
            MetricRow(label: i18n.t("sales.statsReturns"), value: "\(stats.returnedCount)",
                      subtext: "\(i18n.t("sales.statsRefundTotal")): \(MoneyText.format(stats.refundTotal.string))"),
        ]
        if let net = stats.netProfit {
            rows.append(MetricRow(label: i18n.t("sales.statsNetProfit"),
                                  value: MoneyText.format(net.string),
                                  emphasis: moneyTint(.profit, Double(net.string))))
        }
        return MetricList(rows: rows)
    }
}
