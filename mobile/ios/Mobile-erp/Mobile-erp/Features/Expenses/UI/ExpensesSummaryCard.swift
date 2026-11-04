import SwiftUI

/// Period summary card for expenses: total with period delta, top category,
/// and transaction count. Designed with single-column layout so big numbers
/// never get squished or truncated.
struct ExpensesSummaryCard: View {
    let summary: ExpenseSummary
    @Environment(I18n.self) private var i18n

    private var delta: String {
        guard summary.previousTotal > 0 else { return "—" }
        let pct = (summary.total - summary.previousTotal) / summary.previousTotal * 100
        return "\(pct > 0 ? "+" : "")\(String(format: "%.1f", pct))%"
    }

    private var deltaColor: Color {
        guard summary.previousTotal > 0 else { return .secondary }
        let diff = summary.total - summary.previousTotal
        return diff > 0 ? Tokens.danger : Tokens.success
    }

    var body: some View {
        VStack(spacing: 12) {
            // Hero Total Expense Card
            AppCard {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(i18n.t("expenses.metricTotal"))
                            .font(.subheadline)
                            .foregroundStyle(Tokens.muted)
                        Spacer()
                        if summary.previousTotal > 0 {
                            Text(delta)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(deltaColor)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(deltaColor.opacity(0.12), in: Capsule())
                        }
                    }

                    Text(MoneyText.format(String(summary.total)))
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(Tokens.ink)
                        .monospacedDigit()
                        .minimumScaleFactor(0.8)
                        .lineLimit(1)

                    if summary.previousTotal > 0 {
                        Text("\(i18n.t("expenses.metricVsPrevious")): \(MoneyText.format(String(summary.previousTotal)))")
                            .font(.caption)
                            .foregroundStyle(Tokens.muted)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Supporting Metrics
            AppCard {
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("expenses.metricTopCategory"))
                                .font(.caption)
                                .foregroundStyle(Tokens.muted)
                            Text(summary.topCategory?.name ?? "—")
                                .font(.headline)
                                .foregroundStyle(Tokens.ink)
                        }
                        Spacer()
                        if let top = summary.topCategory {
                            Text(MoneyText.format(String(top.total)))
                                .font(.subheadline.weight(.semibold))
                                .monospacedDigit()
                                .foregroundStyle(Tokens.ink)
                        }
                    }

                    Divider()

                    HStack {
                        Text(i18n.t("expenses.metricCount"))
                            .font(.caption)
                            .foregroundStyle(Tokens.muted)
                        Spacer()
                        Text("\(summary.count)")
                            .font(.subheadline.weight(.semibold))
                            .monospacedDigit()
                            .foregroundStyle(Tokens.ink)
                    }
                }
            }
        }
    }
}
