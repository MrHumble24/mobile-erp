import SwiftUI

/// Directory summary tiles from `/customers/stats` — total, new this month, with
/// purchases and repeat buyers (highlighted). Matches the web `CustomerSummary`.
struct CustomersSummary: View {
    let stats: CustomerStats
    @Environment(I18n.self) private var i18n

    var body: some View {
        SummaryTileGrid {
            SummaryTile(label: i18n.t("customers.statTotal"), value: "\(stats.total)")
            SummaryTile(label: i18n.t("customers.statNewThisMonth"), value: "\(stats.newThisMonth)")
            SummaryTile(label: i18n.t("customers.statWithPurchases"), value: "\(stats.withPurchases)")
            SummaryTile(label: i18n.t("customers.statRepeatBuyers"),
                     value: "\(stats.repeatBuyers)", highlight: true)
        }
    }
}
