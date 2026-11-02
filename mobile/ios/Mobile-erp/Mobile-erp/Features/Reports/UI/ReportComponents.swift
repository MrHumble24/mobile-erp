import SwiftUI
import Charts

/// Shared presentation pieces for the report tabs: a labelled figure tile, a
/// responsive grid of them, and a Swift Charts bar card for the breakdowns.

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
        AppCard {
            VStack(alignment: .leading, spacing: 6) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Text(value).font(.title3.weight(.semibold))
                    .foregroundStyle(emphasis ?? Tokens.ink)
                    .monospacedDigit()
                if let subtext {
                    Text(subtext).font(.caption2).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Two columns on phones, three on wider screens (iPad / landscape).
struct MetricGrid: View {
    let tiles: [MetricTile]
    @Environment(\.horizontalSizeClass) private var sizeClass

    var body: some View {
        let columns = Array(
            repeating: GridItem(.flexible(), spacing: 12),
            count: sizeClass == .regular ? 3 : 2
        )
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(Array(tiles.enumerated()), id: \.offset) { $0.element }
        }
    }
}

/// One labelled bar value.
struct BarDatum: Identifiable {
    let label: String
    let value: Double
    var id: String { label }
}

/// A bar chart inside an `AppCard`, drawn with Swift Charts. The tallest bar
/// sets the scale; empty data shows a dash.
struct BarChartCard: View {
    let title: String
    let data: [BarDatum]

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title).font(.subheadline.weight(.medium))
                if data.allSatisfy({ $0.value == 0 }) {
                    Text("—").foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    Chart(data) { datum in
                        BarMark(
                            x: .value("category", datum.label),
                            y: .value("value", datum.value)
                        )
                        .foregroundStyle(Tokens.ink)
                        .cornerRadius(4)
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
