import SwiftUI
import Charts

/// Shared presentation pieces for the report tabs: a labelled figure tile, a
/// single-column vertical layout of them, and a Swift Charts bar card for breakdowns.
/// Strictly avoids multi-column grids for crystal-clear readability.

/// Formats a numeric aggregate as money via the shared `MoneyText` formatter.
func reportMoney(_ value: Double?) -> String {
    guard let value else { return "—" }
    return MoneyText.format(String(value))
}

struct MetricTile: View {
    let label: String
    let value: String
    var subtext: String?
    var emphasis: Color?

    var body: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text(label)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(emphasis ?? Tokens.ink)
                    .monospacedDigit()
                if let subtext {
                    Text(subtext)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Roomy, single-column vertical stack of metric tiles.
struct MetricGrid: View {
    let tiles: [MetricTile]

    var body: some View {
        VStack(spacing: 12) {
            ForEach(Array(tiles.enumerated()), id: \.offset) { _, tile in
                tile
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

/// A bar chart inside an `AppCard`, drawn with Swift Charts.
struct BarChartCard: View {
    let title: String
    let data: [BarDatum]

    var body: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 14) {
                Text(title)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(Tokens.ink)

                if data.allSatisfy({ $0.value == 0 }) {
                    Text("—")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    Chart(data) { datum in
                        BarMark(
                            x: .value("category", datum.label),
                            y: .value("value", datum.value)
                        )
                        .foregroundStyle(Tokens.ink)
                        .cornerRadius(6)
                    }
                    .chartYAxis {
                        AxisMarks(format: Decimal.FormatStyle().notation(.compactName))
                    }
                    .frame(height: 220)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
