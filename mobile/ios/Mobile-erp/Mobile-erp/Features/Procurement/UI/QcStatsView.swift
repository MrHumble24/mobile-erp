import SwiftUI

/// QC statistics for a period: the preset (today / 7 / 30 days) or a custom
/// from/to range, chosen in a kit `FilterSheet`; the active period shows as the
/// heading with a ghost "Filtr" pill. An active custom range overrides the preset.
struct QcStatsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var preset: Preset = .sevenDays
    @State private var range = KitDateRange.all
    @State private var store: AsyncStore<QcStats>?
    @State private var showPeriodSheet = false

    enum Preset: Hashable { case today, sevenDays, thirtyDays, custom }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                HStack {
                    Text(periodLabel).font(.ui(.heading)).foregroundStyle(Tokens.text)
                    Spacer()
                    Button { showPeriodSheet = true } label: {
                        Label(i18n.t("common.filter"), systemImage: preset == .sevenDays ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
                    }
                    .buttonStyle(.pillGhost)
                }
                if let store {
                    LoadableView(state: store.state, retry: reload) { stats in
                        QcStatsBody(stats: stats)
                    }
                } else {
                    AppCard { LoadingView().frame(height: 180) }
                }
            }
            .padding(.bottom, Tokens.Space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .sheet(isPresented: $showPeriodSheet) { periodSheet }
        .task(id: refresh) { await load() }
        .onChange(of: preset) { if preset != .custom { range = .all }; Task { await load(force: true) } }
        .onChange(of: range) { Task { await load(force: true) } }
    }

    private var periodLabel: String {
        switch preset {
        case .today: return i18n.t("qc.preset_today")
        case .sevenDays: return i18n.t("qc.preset_7d")
        case .thirtyDays: return i18n.t("qc.preset_30d")
        case .custom: return i18n.t("qc.preset_custom")
        }
    }

    private var periodSheet: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("inventory.clearFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { preset = .sevenDays },
            onClose: { showPeriodSheet = false }
        ) {
            SegmentedControl(selection: $preset, segments: [
                (.today, i18n.t("qc.preset_today")),
                (.sevenDays, i18n.t("qc.preset_7d")),
                (.thirtyDays, i18n.t("qc.preset_30d")),
                (.custom, i18n.t("qc.preset_custom")),
            ])
            if preset == .custom {
                KitDateRangeField(range: $range)
            }
        }
    }

    private func load(force: Bool = false) async {
        if store == nil || force { store = makeStore() }
        await store?.reload()
    }

    private func makeStore() -> AsyncStore<QcStats> {
        let repo = QcRepository(api: container.api)
        let (from, to) = bounds
        return AsyncStore { try await repo.stats(from: from, to: to) }
    }

    /// Custom range when active, otherwise the selected preset.
    private var bounds: (from: String?, to: String?) {
        if preset == .custom {
            let fmt = ISO8601DateFormatter()
            return (range.from.map(fmt.string(from:)), range.to.map(fmt.string(from:)))
        }
        let now = Date()
        let from: Date
        switch preset {
        case .today: from = Calendar.current.startOfDay(for: now)
        case .thirtyDays: from = now.addingTimeInterval(-30 * 86_400)
        default: from = now.addingTimeInterval(-7 * 86_400)
        }
        let fmt = ISO8601DateFormatter()
        return (fmt.string(from: from), fmt.string(from: now))
    }

    private func reload() { Task { await store?.reload() } }
}
