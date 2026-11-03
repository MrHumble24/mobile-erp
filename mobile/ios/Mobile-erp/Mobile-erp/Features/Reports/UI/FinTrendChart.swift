import SwiftUI
import Charts

/// Simplified, intuitive trend chart designed for non-technical retail users.
/// Rather than confusing overlapping lines, users toggle between Revenue,
/// Gross Profit, and Expenses with clear color-coded bars, total summary,
/// and interactive touch feedback. Bars run on a temporal day/week/month axis
/// (never categorical) so a 30-day series keeps readable bar widths and a
/// handful of date labels instead of one hairline slot per day. Tap a bar to
/// pin the dashed rule + value capsule.
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
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 14) {
                header
                modePicker

                if isEmpty {
                    emptyState
                } else {
                    chartSection
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
                Spacer()
                if let selected = activePoint {
                    Text("\(formatDate(selected.bucket)): \(reportMoney(valueFor(selected)))")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(colorFor(valueFor(selected)))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(colorFor(valueFor(selected)).opacity(0.12), in: Capsule())
                }
            }

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(reportMoney(totalForMode))
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(colorFor(totalForMode))
                    .monospacedDigit()
                Text(modeLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var modePicker: some View {
        HStack(spacing: 6) {
            ForEach(MetricMode.allCases) { m in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    mode = m
                    selectedBucket = nil
                } label: {
                    Text(pickerLabel(m))
                        .font(.caption.weight(mode == m ? .semibold : .regular))
                        .foregroundStyle(mode == m ? Tokens.onInk : Tokens.ink)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(mode == m ? Tokens.ink : Tokens.mist, in: Capsule())
                        .overlay(
                            Capsule().strokeBorder(mode == m ? Color.clear : Tokens.hairline, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var chartSection: some View {
        Chart {
            ForEach(points) { point in
                let val = valueFor(point)
                BarMark(
                    x: .value("Period", bucketDate(point.bucket) ?? .now, unit: unit),
                    y: .value("Amount", val),
                    width: barWidth
                )
                .foregroundStyle(colorFor(val))
                .cornerRadius(3)
                .opacity(selectedBucket == nil || selectedBucket == point.bucket ? 1.0 : 0.4)
            }

            if let selected = activePoint, let date = bucketDate(selected.bucket) {
                RuleMark(x: .value("Selected", date, unit: unit))
                    .foregroundStyle(Tokens.slate.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 6)) { _ in
                AxisGridLine()
                AxisValueLabel(format: unit == .month ? monthAxisFormat : dayAxisFormat)
            }
        }
        .chartYAxis {
            AxisMarks(format: Decimal.FormatStyle().notation(.compactName))
        }
        .chartOverlay { proxy in
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture(count: 1, coordinateSpace: .local) { location in
                    select(at: location, proxy: proxy)
                }
        }
        .frame(height: 230)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "chart.bar.xaxis")
                .font(.title)
                .foregroundStyle(.tertiary)
            Text(i18n.t("reports.empty", default: "No data for this period"))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
    }

    /// Tap anywhere in the plot to pin the dashed rule + value capsule on the
    /// nearest bucket; tapping the same bucket again clears the selection.
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

    /// One temporal unit per server bucket: `day` · `week` · `month`.
    private var unit: Calendar.Component {
        switch bucket {
        case "week": return .weekOfYear
        case "month": return .month
        default: return .day
        }
    }

    /// A dense day series renders hairline slots — pin a readable bar width.
    private var barWidth: MarkDimension {
        unit == .day && points.count > 14 ? .fixed(10) : .automatic
    }

    /// Labels follow the app locale (uz/en), not the device preference.
    private var axisLocale: Locale { Locale(identifier: i18n.locale.hasPrefix("uz") ? "uz_UZ" : "en_US") }
    private var dayAxisFormat: Date.FormatStyle {
        Date.FormatStyle.dateTime.day().month(.abbreviated).locale(axisLocale)
    }
    private var monthAxisFormat: Date.FormatStyle {
        Date.FormatStyle.dateTime.month(.abbreviated).year(.twoDigits).locale(axisLocale)
    }

    private var activePoint: TrendPoint? {
        guard let b = selectedBucket else { return nil }
        return points.first { $0.bucket == b }
    }

    private var totalForMode: Double {
        points.reduce(0) { $0 + valueFor($1) }
    }

    private func valueFor(_ p: TrendPoint) -> Double {
        switch mode {
        case .revenue: return p.revenue
        case .grossProfit: return p.grossProfit
        case .expenses: return p.expenses
        }
    }

    private func colorFor(_ value: Double) -> Color {
        switch mode {
        case .revenue:
            return Tokens.signalBlue
        case .grossProfit:
            return value >= 0 ? Tokens.success : Tokens.danger
        case .expenses:
            return Tokens.danger
        }
    }

    private var modeLabel: String {
        switch mode {
        case .revenue: return i18n.t("dashboard.revenue")
        case .grossProfit: return i18n.t("dashboard.grossProfit")
        case .expenses: return i18n.t("dashboard.expenses")
        }
    }

    private func pickerLabel(_ m: MetricMode) -> String {
        switch m {
        case .revenue: return i18n.t("dashboard.revenue")
        case .grossProfit: return i18n.t("dashboard.grossProfit")
        case .expenses: return i18n.t("dashboard.expenses")
        }
    }

    private func formatDate(_ raw: String) -> String {
        let parts = raw.split(separator: "-")
        guard parts.count == 3, let d = Int(parts[2]), let m = Int(parts[1]) else { return raw }
        let monthsUz = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"]
        let monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        let isUz = i18n.locale.hasPrefix("uz")
        let monthName = (m >= 1 && m <= 12) ? (isUz ? monthsUz[m - 1] : monthsEn[m - 1]) : "\(m)"
        return isUz ? "\(d)-\(monthName)" : "\(monthName) \(d)"
    }
}
