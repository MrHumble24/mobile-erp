import SwiftUI

/// Summary tiles from `/sales/stats` — count, revenue, average price, returns
/// (with refunded subtext) and net profit (highlighted, shown only when the
/// server included it). Matches the web `SalesSummary`.
struct SalesSummary: View {
    let stats: SaleStatsView
    @Environment(I18n.self) private var i18n

    var body: some View {
        SummaryTileGrid {
            SummaryTile(label: i18n.t("sales.statsCount"), value: "\(stats.count)")
            SummaryTile(label: i18n.t("sales.statsRevenue"),
                     value: MoneyText.format(stats.revenue.string))
            SummaryTile(label: i18n.t("sales.statsAvgPrice"),
                     value: MoneyText.format(stats.avgPrice.string))
            SummaryTile(label: i18n.t("sales.statsReturns"),
                     value: "\(stats.returnedCount)",
                     subtext: "\(i18n.t("sales.statsRefundTotal")): \(MoneyText.format(stats.refundTotal.string))")
            if let net = stats.netProfit {
                SummaryTile(label: i18n.t("sales.statsNetProfit"),
                         value: MoneyText.format(net.string), highlight: true)
            }
        }
    }
}
