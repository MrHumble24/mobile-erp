import SwiftUI
import Charts

/// Shared presentation pieces for the report tabs: a labelled figure tile, a
/// responsive hero + 2-column grid layout, and a Swift Charts bar card for breakdowns.

/// Formats a numeric aggregate as money via the shared `MoneyText` formatter.
func reportMoney(_ value: Double?) -> String {
    guard let value else { return "—" }
    return MoneyText.format(String(value))
}

struct MetricTile: View, Identifiable {
    var id: String { label }
    let label: String
    let value: String
    var subtext: String?
    var emphasis: Color?
    var icon: String? = nil
    var iconColor: Color? = nil
    var badge: String? = nil
    var badgeColor: Color? = nil
    var isHero: Bool = false
    var onTap: (() -> Void)? = nil

    var body: some View {
        if let onTap {
            Button(action: {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                onTap()
            }) {
                card
            }
            .buttonStyle(.plain)
        } else {
            card
        }
    }

    @ViewBuilder private var card: some View {
        if isHero {
            heroCard
        } else {
            standardCard
        }
    }

    private var heroCard: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    if let icon {
                        Image(systemName: icon)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(iconColor ?? Tokens.ink)
                    }
                    Text(label)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                    Spacer()
                    if let badge {
                        Text(badge)
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(badgeColor ?? Tokens.ink)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background((badgeColor ?? Tokens.ink).opacity(0.12), in: Capsule())
                    }
                    if onTap != nil {
                        Image(systemName: "chevron.right")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.tertiary)
                    }
                }
                Text(value)
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(emphasis ?? Tokens.ink)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                if let subtext {
                    Text(subtext)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var standardCard: some View {
        AppCard(padding: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    if let icon {
                        Image(systemName: icon)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(iconColor ?? Tokens.ink)
                    }
                    Text(label)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    if onTap != nil {
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
                Text(value)
                    .font(.system(size: 19, weight: .bold))
                    .foregroundStyle(emphasis ?? Tokens.ink)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                if let subtext {
                    Text(subtext)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Responsive grid: renders full-width hero cards on top, and secondary metric tiles
/// in a balanced 2-column grid for dense, readable mobile presentation.
struct MetricGrid: View {
    let tiles: [MetricTile]

    var body: some View {
        let heroes = tiles.filter(\.isHero)
        let standard = tiles.filter { !$0.isHero }

        VStack(spacing: 10) {
            ForEach(heroes) { hero in
                hero
            }
            if !standard.isEmpty {
                LazyVGrid(
                    columns: [
                        GridItem(.flexible(), spacing: 10),
                        GridItem(.flexible(), spacing: 10)
                    ],
                    spacing: 10
                ) {
                    ForEach(standard) { tile in
                        tile
                    }
                }
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

/// A bar chart inside an `AppCard`, drawn with Swift Charts. Past six
/// categories the x labels are dropped — the accompanying list (e.g. the
/// `FinShareList` below) names the rows, and no labels beat overlapping ones.
struct BarChartCard: View {
    let title: String
    let data: [BarDatum]
    private let maxVisibleLabels = 6

    var body: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text(title)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                    Spacer()
                }

                if data.isEmpty || data.allSatisfy({ $0.value == 0 }) {
                    VStack(spacing: 8) {
                        Image(systemName: "chart.bar.xaxis")
                            .font(.title)
                            .foregroundStyle(.tertiary)
                        Text("—")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 160)
                } else {
                    Chart(data) { datum in
                        BarMark(
                            x: .value("category", datum.label),
                            y: .value("value", datum.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Tokens.signalBlue, Tokens.signalBlue.opacity(0.75)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .cornerRadius(6)
                    }
                    .chartXAxis {
                        if data.count <= maxVisibleLabels {
                            AxisMarks { _ in
                                AxisGridLine()
                                AxisValueLabel().font(.caption2)
                            }
                        } else {
                            AxisMarks { _ in
                                AxisGridLine()
                            }
                        }
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
