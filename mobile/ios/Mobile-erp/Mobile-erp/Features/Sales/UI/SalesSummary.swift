import SwiftUI

/// Summary from `/sales/stats`, collapsed by default behind one header row —
/// "Umumiy sharh", the revenue at a glance, a chevron — so the five metric rows
/// never push the first sale below the fold. Net profit is tinted by sign and
/// shown only when the server included it. Same anatomy as Android.
struct SalesSummary: View {
    let stats: SaleStatsView
    @Binding var expanded: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: Tokens.Space.sm) {
            Button {
                withAnimation(.easeOut(duration: 0.15)) { expanded.toggle() }
            } label: {
                HStack(spacing: Tokens.Space.sm) {
                    Text(i18n.t("reports.tab_overview"))
                        .font(.ui(.label))
                        .foregroundStyle(Tokens.muted)
                    Spacer(minLength: Tokens.Space.sm)
                    Text(MoneyText.format(stats.revenue.string))
                        .font(.mono(17, weight: .semibold))
                        .foregroundStyle(Tokens.text)
                    Image(systemName: "chevron.down")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Tokens.muted)
                        .rotationEffect(.degrees(expanded ? 180 : 0))
                }
                .frame(minHeight: Tokens.Space.rowH)
                .padding(.horizontal, Tokens.Space.cardPad)
                .padding(.vertical, Tokens.Space.sm)
                .background(Tokens.card)
                .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(.isButton)

            if expanded { MetricList(rows: rows) }
        }
    }

    private var rows: [MetricRow] {
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
        return rows
    }
}
