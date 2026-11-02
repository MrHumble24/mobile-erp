import SwiftUI

/// QC statistics with quick date-range presets.
///
/// ponytail: the three presets cover daily use; an arbitrary custom range
/// (`qc.preset_custom`) is skipped until someone needs it.
struct QcStatsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var preset = "7d"
    @State private var store: AsyncStore<QcStats>?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Picker("", selection: $preset) {
                    ForEach(["today", "7d", "30d"], id: \.self) { p in
                        Text(i18n.t("qc.preset_\(p)")).tag(p)
                    }
                }
                .pickerStyle(.segmented)

                if let store {
                    LoadableView(state: store.state, retry: reload) { stats in
                        StatsBody(stats: stats)
                    }
                } else {
                    LoadingView()
                }
            }
            .padding()
        }
        .task(id: refresh) { await load() }
        .onChange(of: preset) { Task { await load(force: true) } }
    }

    private func load(force: Bool = false) async {
        if store == nil || force { store = makeStore() }
        await store?.reload()
    }

    private func makeStore() -> AsyncStore<QcStats> {
        let repo = QcRepository(api: ProcApi(container))
        let range = Self.range(for: preset)
        return AsyncStore { try await repo.stats(from: range.from, to: range.to) }
    }

    private func reload() { Task { await store?.reload() } }

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

private struct StatsBody: View {
    @Environment(I18n.self) private var i18n
    let stats: QcStats

    private let columns = [GridItem(.adaptive(minimum: 140), spacing: 12)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            StatTile(label: i18n.t("qc.statInspected"), value: "\(stats.inspected)")
            StatTile(label: i18n.t("qc.statPassRate"), value: "\(Int((stats.passRate * 100).rounded()))%")
            StatTile(label: i18n.t("qc.statFailed"), value: "\(stats.failed)")
            StatTile(label: i18n.t("qc.awaitingInspection"), value: "\(stats.awaitingInspection)")
            StatTile(label: i18n.t("qc.statAvgBattery"),
                     value: stats.avgBatteryHealth.map { "\($0)%" } ?? "-")
        }
        Breakdown(title: i18n.t("qc.byGrade"), rows: stats.byGrade)
        Breakdown(title: i18n.t("qc.topDefects"), rows: stats.topDefects)
    }
}

private struct StatTile: View {
    let label: String
    let value: String
    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: 4) {
                Text(value).font(.title3.weight(.semibold)).foregroundStyle(Tokens.ink)
                Text(label).font(.caption).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct Breakdown: View {
    @Environment(I18n.self) private var i18n
    let title: String
    let rows: [QcCount]

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: 10) {
                Text(title).font(.headline)
                if rows.isEmpty {
                    Text(i18n.t("common.notFound")).font(.caption).foregroundStyle(.secondary)
                } else {
                    let maxCount = max(rows.map(\.count).max() ?? 1, 1)
                    ForEach(rows) { row in
                        HStack {
                            Text(row.label).font(.subheadline)
                            Spacer()
                            Text("\(row.count)").font(.caption).foregroundStyle(.secondary)
                        }
                        ProgressView(value: Double(row.count), total: Double(maxCount))
                            .tint(Tokens.ink)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
