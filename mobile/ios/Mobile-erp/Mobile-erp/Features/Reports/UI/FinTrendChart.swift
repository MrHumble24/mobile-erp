import SwiftUI
import Charts

/// Revenue · gross profit · expenses over the period, one series at a time
/// behind the kit segmented control, as bars on a temporal day/week/month
/// axis (never categorical, so a 30-day series keeps readable bars). Revenue
/// takes the text colour, profit success/danger by sign, expenses danger. Tap
/// a bar to pin its value in the header line.
struct FinTrendChart: View {
    let title: String
    let bucket: String
    let points: [TrendPoint]
    @Environment(I18n.self) private var i18n

    enum MetricMode: String, CaseIterable, Identifiable {
        case revenue, grossProfit, expenses
        var id: String { rawValue }
    }

    @State private var mode: MetricMode = .revenue
    @State private var selectedBucket: String?

    private var isEmpty: Bool {
        points.isEmpty || points.allSatisfy { $0.revenue == 0 && $0.grossProfit == 0 && $0.expenses == 0 }
    }

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(title).font(.ui(.heading)).foregroundStyle(Tokens.text)
                SegmentedControl(selection: $mode, segments: MetricMode.allCases.map { ($0, label($0)) })
                    .onChange(of: mode) { selectedBucket = nil }
                HStack(alignment: .firstTextBaseline, spacing: Tokens.Space.sm) {
                    Text(headerLabel).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    Spacer(minLength: Tokens.Space.sm)
                    Text(reportMoney(headerValue)).font(.mono(17, weight: .semibold)).foregroundStyle(colorFor(headerValue))
                }
                if isEmpty {
                    Text(i18n.t("reports.empty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                        .frame(maxWidth: .infinity, minHeight: 120)
                } else {
                    chartSection
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var chartSection: some View {
        Chart {
            ForEach(points) { point in
                let val = valueFor(point)
                BarMark(x: .value("Period", bucketDate(point.bucket) ?? .now, unit: unit), y: .value("Amount", val), width: barWidth)
                    .foregroundStyle(colorFor(val))
                    .cornerRadius(3)
                    .opacity(selectedBucket == nil || selectedBucket == point.bucket ? 1.0 : 0.35)
            }
            if let selected = activePoint, let date = bucketDate(selected.bucket) {
                RuleMark(x: .value("Selected", date, unit: unit))
                    .foregroundStyle(Tokens.muted)
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 5)) { _ in
                AxisValueLabel(format: unit == .month ? monthAxisFormat : dayAxisFormat).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
        }
        .chartYAxis {
            AxisMarks(values: .automatic(desiredCount: 3)) { _ in
                AxisGridLine().foregroundStyle(Tokens.border)
                AxisValueLabel(format: Decimal.FormatStyle().notation(.compactName)).font(.mono(11)).foregroundStyle(Tokens.muted)
            }
        }
        .chartOverlay { proxy in
            Color.clear.contentShape(Rectangle())
                .onTapGesture(count: 1, coordinateSpace: .local) { location in select(at: location, proxy: proxy) }
        }
        .frame(height: 200)
    }

    private func select(at location: CGPoint, proxy: ChartProxy) {
        guard let tapped = proxy.value(atX: location.x, as: Date.self) else { return }
        func gap(_ point: TrendPoint) -> TimeInterval {
            (bucketDate(point.bucket)?.timeIntervalSince1970 ?? 0) - tapped.timeIntervalSince1970
        }
        guard let nearest = points.min(by: { abs(gap($0)) < abs(gap($1)) }) else { return }
        selectedBucket = selectedBucket == nearest.bucket ? nil : nearest.bucket
    }

    /// Server buckets are UTC ISO days — parse in UTC so labels never drift.
    private static let bucketFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter
    }()
    private func bucketDate(_ raw: String) -> Date? { Self.bucketFormatter.date(from: raw) }

    private var unit: Calendar.Component {
        switch bucket {
        case "week": return .weekOfYear
        case "month": return .month
        default: return .day
        }
    }
    private var barWidth: MarkDimension { unit == .day && points.count > 14 ? .fixed(8) : .automatic }
    private var axisLocale: Locale { Locale(identifier: i18n.locale.hasPrefix("uz") ? "uz_UZ" : "en_US") }
    private var dayAxisFormat: Date.FormatStyle { Date.FormatStyle.dateTime.day().month(.abbreviated).locale(axisLocale) }
    private var monthAxisFormat: Date.FormatStyle { Date.FormatStyle.dateTime.month(.abbreviated).year(.twoDigits).locale(axisLocale) }

    private var activePoint: TrendPoint? {
        guard let b = selectedBucket else { return nil }
        return points.first { $0.bucket == b }
    }
    private var headerValue: Double { activePoint.map(valueFor) ?? points.reduce(0) { $0 + valueFor($1) } }
    private var headerLabel: String { activePoint.map { $0.bucket } ?? i18n.t("reports.period") }

    private func valueFor(_ p: TrendPoint) -> Double {
        switch mode {
        case .revenue: return p.revenue
        case .grossProfit: return p.grossProfit
        case .expenses: return p.expenses
        }
    }
    private func colorFor(_ value: Double) -> Color {
        switch mode {
        case .revenue: return Tokens.text
        case .grossProfit: return value >= 0 ? Tokens.success : Tokens.danger
        case .expenses: return Tokens.danger
        }
    }
    private func label(_ m: MetricMode) -> String {
        switch m {
        case .revenue: return i18n.t("dashboard.revenue")
        case .grossProfit: return i18n.t("dashboard.grossProfit")
        case .expenses: return i18n.t("dashboard.expenses")
        }
    }
}
