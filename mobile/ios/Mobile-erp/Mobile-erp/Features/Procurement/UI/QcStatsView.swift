import SwiftUI

/// Quality control stats tab: pass rate, queue metrics, grade distribution,
/// and top defect breakdown across selected time presets (today / 7d / 30d).
/// Strictly avoids multi-column grids for crystal-clear readability.
struct QcStatsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var preset = "7d"
    @State private var store: AsyncStore<QcStats>?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Picker(i18n.t("reports.period", default: "Period"), selection: $preset) {
                    Text(i18n.t("reports.today", default: "Today")).tag("today")
                    Text("7 \(i18n.t("reports.days", default: "Days"))").tag("7d")
                    Text("30 \(i18n.t("reports.days", default: "Days"))").tag("30d")
                }
                .pickerStyle(.segmented)
                .onChange(of: preset) { _, _ in reload() }

                if let store {
                    LoadableView(state: store.state, retry: reload) { stats in
                        StatsBody(stats: stats)
                    }
                } else {
                    LoadingView().frame(height: 180)
                }
            }
            .padding()
        }
        .task(id: refresh) {
            if store == nil {
                let repo = QcRepository(api: container.api)
                store = AsyncStore {
                    let (f, t) = Self.range(for: preset)
                    return try await repo.stats(from: f, to: t)
                }
            }
            await store?.reload()
        }
    }

    private func reload() {
        Task { await store?.reload() }
    }

    static func range(for preset: String) -> (from: String, to: String) {
        let now = Date()
        let from: Date
        switch preset {
        case "today": from = Calendar.current.startOfDay(for: now)
        case "30d": from = now.addingTimeInterval(-30 * 86_400)
        default: from = now.addingTimeInterval(-7 * 86_400)
        }
        let fmt = ISO8601DateFormatter()
        return (fmt.string(from: from), fmt.string(from: now))
    }
}

/// Single-column, roomy stats overview.
private struct StatsBody: View {
    @Environment(I18n.self) private var i18n
    let stats: QcStats

    private var passPercentage: Int {
        Int((stats.passRate * 100).rounded())
    }

    var body: some View {
        VStack(spacing: 14) {
            // 1. Hero Card: Pass Rate
            AppCard(padding: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Label(i18n.t("qc.statPassRate", default: "QC Pass Rate"),
                              systemImage: "checkmark.seal.fill")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(passPercentage >= 90 ? Tokens.success : Tokens.warning)
                        Spacer()
                        StatusBadge(
                            passPercentage >= 90
                                ? i18n.t("qc.passHigh", default: "Good Quality")
                                : i18n.t("qc.passAttention", default: "Needs Attention"),
                            color: passPercentage >= 90 ? Tokens.success : Tokens.warning
                        )
                    }

                    Text("\(passPercentage)%")
                        .font(.system(size: 34, weight: .bold))
                        .foregroundStyle(Tokens.ink)

                    Text(i18n.t("qc.passRateDesc", default: "Percentage of received devices cleared for sale without critical hardware defects."))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // 2. Queue Alert (when units are awaiting inspection)
            if stats.awaitingInspection > 0 {
                AppCard(
                    padding: 14,
                    backgroundColor: Tokens.warning.opacity(0.12),
                    borderColor: Tokens.warning.opacity(0.35)
                ) {
                    HStack(spacing: 12) {
                        Image(systemName: "clock.badge.exclamationmark")
                            .font(.title2)
                            .foregroundStyle(Tokens.warning)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(stats.awaitingInspection) \(i18n.t("qc.awaitingInspection", default: "Devices in Inspection Queue"))")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(Tokens.ink)

                            Text(i18n.t("qc.awaitingDesc", default: "Units waiting for cosmetic & hardware grading."))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                }
            }

            // 3. Inspection Volume & Battery Overview
            AppCard(padding: 16) {
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("qc.statInspected", default: "Total Devices Inspected"))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Tokens.ink)
                            Text(i18n.t("qc.inspectedDesc", default: "Completed unit inspections"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(stats.inspected)")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Tokens.ink)
                    }

                    Divider()

                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("qc.statFailed", default: "Defective / Failed Units"))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Tokens.ink)
                            Text(i18n.t("qc.failedDesc", default: "Units isolated for repair or return"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(stats.failed)")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(stats.failed > 0 ? Tokens.danger : Tokens.ink)
                    }

                    if let avgBattery = stats.avgBatteryHealth {
                        Divider()

                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(i18n.t("qc.statAvgBattery", default: "Average Battery Health"))
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Tokens.ink)
                                Text(i18n.t("qc.batteryDesc", default: "Average battery capacity across inspected stock"))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(avgBattery)%")
                                .font(.title3.weight(.bold))
                                .foregroundStyle(Tokens.ink)
                        }
                    }
                }
            }

            // 4. Breakdown Cards
            Breakdown(title: i18n.t("qc.byGrade", default: "Distribution by Grade"), rows: stats.byGrade)
            Breakdown(title: i18n.t("qc.topDefects", default: "Most Common Defects"), rows: stats.topDefects)
        }
    }
}

private struct Breakdown: View {
    @Environment(I18n.self) private var i18n
    let title: String
    let rows: [QcCount]

    var body: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(Tokens.ink)

                if rows.isEmpty {
                    Text(i18n.t("common.notFound", default: "No records found."))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    let maxCount = max(rows.map(\.count).max() ?? 1, 1)
                    ForEach(rows) { row in
                        VStack(spacing: 4) {
                            HStack {
                                Text(row.label)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Tokens.ink)
                                Spacer()
                                Text("\(row.count)")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.secondary)
                            }
                            ProgressView(value: Double(row.count), total: Double(maxCount))
                                .tint(Tokens.ink)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
