import SwiftUI
import Charts

/// Revenue / gross profit / expenses over time (`/reports/trend`), drawn as
/// three Swift Charts line series. An all-zero or empty series shows a dash.
struct FinTrendChart: View {
    let title: String
    let points: [TrendPoint]
    @Environment(I18n.self) private var i18n

    private var isEmpty: Bool {
        points.isEmpty || points.allSatisfy { $0.revenue == 0 && $0.grossProfit == 0 && $0.expenses == 0 }
    }

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title).font(.subheadline.weight(.medium))
                if isEmpty {
                    Text("—").foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else {
                    chart
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var series: [(key: String, label: String, color: Color)] {
        [("revenue", i18n.t("dashboard.revenue"), Tokens.signalBlue),
         ("grossProfit", i18n.t("dashboard.grossProfit"), Tokens.success),
         ("expenses", i18n.t("dashboard.expenses"), Tokens.danger)]
    }

    private func value(_ point: TrendPoint, _ key: String) -> Double {
        switch key {
        case "revenue": point.revenue
        case "grossProfit": point.grossProfit
        default: point.expenses
        }
    }

    private var chart: some View {
        Chart {
            ForEach(series, id: \.key) { line in
                ForEach(points) { point in
                    LineMark(
                        x: .value("bucket", point.bucket),
                        y: .value("value", value(point, line.key))
                    )
                    .foregroundStyle(by: .value("series", line.label))
                    .interpolationMethod(.monotone)
                }
            }
        }
        .chartForegroundStyleScale(domain: series.map(\.label), range: series.map(\.color))
        .chartYAxis { AxisMarks(format: Decimal.FormatStyle().notation(.compactName)) }
        .chartXAxis { AxisMarks(values: .automatic(desiredCount: 4)) }
        .chartLegend(position: .bottom, spacing: 8)
        .frame(height: 240)
    }
}
