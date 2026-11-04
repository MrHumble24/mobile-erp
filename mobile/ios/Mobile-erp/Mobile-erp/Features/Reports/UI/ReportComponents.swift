import SwiftUI
import Charts

/// Shared presentation pieces for the report sections: money formatting, the
/// ranked horizontal breakdown (text bar on the border track — never a hue),
/// and the small vertical bar card used where a handful of values compare.

/// Formats a numeric aggregate as money via the shared `MoneyText` formatter.
func reportMoney(_ value: Double?) -> String {
    guard let value else { return "—" }
    return MoneyText.format(String(value))
}

/// One row of a breakdown: label, preformatted value and 0–1 share.
struct FinShareRow: Identifiable {
    let key: String
    let label: String
    let value: String
    let share: Double
    /// A negative magnitude (e.g. a loss) draws its bar in the danger hue.
    var negative: Bool = false
    var id: String { key }
}

/// Ranked horizontal bars inside an `AppCard`: label · value · share on one
/// line, the magnitude as a text-colour bar on the border track below. Rows
/// are tappable when `onSelect` is set (drill-down).
struct FinBreakdownBars: View {
    let title: String
    let rows: [FinShareRow]
    var onSelect: ((String) -> Void)? = nil
    /// Off for magnitudes that are not shares of a whole (e.g. average prices).
    var showsShare = true
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(title).font(.ui(.heading)).foregroundStyle(Tokens.text)
                if rows.isEmpty {
                    Text(i18n.t("reports.empty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                } else {
                    FinBreakdownRows(rows: rows, onSelect: onSelect, showsShare: showsShare)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// The bar rows alone, for a sheet or a composite card (never a nested card).
struct FinBreakdownRows: View {
    let rows: [FinShareRow]
    var onSelect: ((String) -> Void)? = nil
    var showsShare = true

    var body: some View {
        let maxShare = max(rows.map(\.share).max() ?? 0, 0.0001)
        VStack(spacing: Tokens.Space.md) {
            ForEach(rows) { row in
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    HStack(spacing: Tokens.Space.sm) {
                        Text(row.label).font(.ui(.body)).foregroundStyle(Tokens.text).lineLimit(1)
                        Spacer(minLength: Tokens.Space.sm)
                        Text(showsShare ? "\(row.value) · \(String(format: "%.1f", row.share * 100))%" : row.value)
                            .font(.mono(12)).foregroundStyle(Tokens.muted)
                        if onSelect != nil {
                            Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(Tokens.muted)
                        }
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Tokens.border)
                            Capsule().fill(row.negative ? Tokens.danger : Tokens.text).frame(width: geo.size.width * CGFloat(row.share / maxShare))
                        }
                    }
                    .frame(height: 6)
                }
                .contentShape(Rectangle())
                .onTapGesture { if let onSelect { Haptic.tick.play(); onSelect(row.key) } }
            }
        }
    }
}

/// One labelled bar value.
struct BarDatum: Identifiable {
    let label: String
    let value: Double
    var id: String { label }
}

/// A small vertical bar card (Swift Charts) for a handful of comparable
/// values — closing-day figures, average prices. Bars take the text colour;
/// negative values the danger hue. Long or many labels are dropped (the rows
/// or cards below name the bars) rather than overlapping.
struct BarChartCard: View {
    let title: String
    let data: [BarDatum]
    @Environment(I18n.self) private var i18n

    private var showsLabels: Bool { data.count <= 6 && data.allSatisfy { $0.label.count <= 14 } }

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(title).font(.ui(.heading)).foregroundStyle(Tokens.text)
                if data.isEmpty || data.allSatisfy({ $0.value == 0 }) {
                    Text(i18n.t("reports.empty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                        .frame(maxWidth: .infinity, minHeight: 120)
                } else {
                    Chart(data) { datum in
                        BarMark(x: .value("category", datum.label), y: .value("value", datum.value))
                            .foregroundStyle(datum.value < 0 ? Tokens.danger : Tokens.text)
                            .cornerRadius(4)
                    }
                    .chartXAxis {
                        AxisMarks { _ in
                            if showsLabels { AxisValueLabel().font(.ui(.caption)).foregroundStyle(Tokens.muted) }
                        }
                    }
                    .chartYAxis {
                        AxisMarks(values: .automatic(desiredCount: 3)) { _ in
                            AxisGridLine().foregroundStyle(Tokens.border)
                            AxisValueLabel(format: Decimal.FormatStyle().notation(.compactName)).font(.mono(11)).foregroundStyle(Tokens.muted)
                        }
                    }
                    .frame(height: 200)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
