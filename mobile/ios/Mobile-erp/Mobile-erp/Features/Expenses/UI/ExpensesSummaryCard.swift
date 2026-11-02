import SwiftUI

/// Period summary tiles for the expense list: total, change vs the previous
/// period, top category and entry count (web `ExpensesSummary`).
struct ExpensesSummaryCard: View {
    let summary: ExpenseSummary
    @Environment(I18n.self) private var i18n

    private var delta: String {
        guard summary.previousTotal > 0 else { return "—" }
        let pct = (summary.total - summary.previousTotal) / summary.previousTotal * 100
        return "\(pct > 0 ? "+" : "")\(String(format: "%.1f", pct))%"
    }

    var body: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 2)
        LazyVGrid(columns: columns, spacing: 12) {
            tile(i18n.t("expenses.metricTotal"), MoneyText.format(String(summary.total)), emphasis: Tokens.ink)
            tile(i18n.t("expenses.metricVsPrevious"), delta,
                 subtext: MoneyText.format(String(summary.previousTotal)))
            tile(i18n.t("expenses.metricTopCategory"), summary.topCategory?.name ?? "—",
                 subtext: summary.topCategory.map { MoneyText.format(String($0.total)) })
            tile(i18n.t("expenses.metricCount"), "\(summary.count)")
        }
    }

    private func tile(_ label: String, _ value: String, subtext: String? = nil,
                      emphasis: Color? = nil) -> some View {
        AppCard {
            VStack(alignment: .leading, spacing: 6) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Text(value).font(.title3.weight(.semibold))
                    .foregroundStyle(emphasis ?? Tokens.ink).monospacedDigit().lineLimit(1)
                if let subtext {
                    Text(subtext).font(.caption2).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
