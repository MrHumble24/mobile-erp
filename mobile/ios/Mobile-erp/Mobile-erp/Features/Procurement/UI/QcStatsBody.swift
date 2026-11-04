import SwiftUI

/// The QC figures as one `MetricList` (inspected, pass rate, failed, awaiting,
/// average battery) and two breakdown cards — the Android `QcStatsTab`.
struct QcStatsBody: View {
    @Environment(I18n.self) private var i18n
    let stats: QcStats

    var body: some View {
        VStack(spacing: Tokens.Space.lg) {
            MetricList(rows: [
                MetricRow(label: i18n.t("qc.statInspected"), value: "\(stats.inspected)"),
                MetricRow(label: i18n.t("qc.statPassRate"), value: "\(Int((stats.passRate * 100).rounded()))%",
                          emphasis: stats.inspected == 0 ? nil : (stats.passRate >= 0.9 ? Tokens.success : Tokens.warning)),
                MetricRow(label: i18n.t("qc.statFailed"), value: "\(stats.failed)",
                          emphasis: stats.failed > 0 ? Tokens.danger : nil),
                MetricRow(label: i18n.t("qc.awaitingInspection"), value: "\(stats.awaitingInspection)"),
                MetricRow(label: i18n.t("qc.statAvgBattery"), value: stats.avgBatteryHealth.map { "\($0)%" } ?? "—"),
            ])
            QcBreakdownCard(title: i18n.t("qc.byGrade"), rows: stats.byGrade)
            QcBreakdownCard(title: i18n.t("qc.topDefects"), rows: stats.topDefects)
        }
    }
}

/// A breakdown card: label, mono count and a bar in the text colour on the
/// warm border track — charts never take the orange.
struct QcBreakdownCard: View {
    @Environment(I18n.self) private var i18n
    let title: String
    let rows: [QcCount]

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(title).font(.ui(.heading)).foregroundStyle(Tokens.text)
                if rows.isEmpty {
                    Text(i18n.t("common.notFound")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                } else {
                    let maxCount = max(rows.map(\.count).max() ?? 1, 1)
                    ForEach(rows) { row in
                        VStack(spacing: Tokens.Space.xs) {
                            HStack {
                                Text(row.label).font(.ui(.body)).foregroundStyle(Tokens.text)
                                Spacer()
                                Text("\(row.count)").font(.data(.regular)).foregroundStyle(Tokens.text)
                            }
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Tokens.border)
                                    Capsule().fill(Tokens.text)
                                        .frame(width: geo.size.width * CGFloat(row.count) / CGFloat(maxCount))
                                }
                            }
                            .frame(height: 6)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
