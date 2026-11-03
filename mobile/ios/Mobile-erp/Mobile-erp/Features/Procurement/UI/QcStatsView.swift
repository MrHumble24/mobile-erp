import SwiftUI

/// QC statistics with quick date-range presets plus a custom from/to range
/// (`KitDateRangeField`). An active custom range overrides the preset.
/// Strictly avoids multi-column grids for crystal-clear readability.
struct QcStatsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    @State private var preset = "7d"
    @State private var range = KitDateRange.all
    @State private var store: AsyncStore<QcStats>?
    @State private var showPeriodSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HStack {
                    Label(periodSummary, systemImage: "calendar")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(Tokens.ink)
                    Spacer()
                    Button(i18n.t("common.edit", default: "O'zgartirish")) {
                        showPeriodSheet = true
                    }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Tokens.signalBlue)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12))

                if let store {
                    LoadableView(state: store.state, retry: reload) { stats in
                        QcStatsBody(stats: stats)
                    }
                } else {
                    LoadingView().frame(height: 180)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(i18n.t("qc.tabStats", default: "QC Statistikasi"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showPeriodSheet = true
                } label: {
                    Image(systemName: "calendar")
                        .foregroundStyle(Tokens.signalBlue)
                }
            }
        }
        .sheet(isPresented: $showPeriodSheet) {
            periodSheet
        }
        .task(id: refresh) { await load() }
        .onChange(of: preset) { Task { await load(force: true) } }
        .onChange(of: range) { Task { await load(force: true) } }
    }

    private var periodSummary: String {
        if range.isActive { return i18n.t("reports.customRange", default: "Maxsus muddat") }
        switch preset {
        case "today": return i18n.t("reports.today", default: "Bugun")
        case "30d": return "30 \(i18n.t("reports.days", default: "Kun"))"
        default: return "7 \(i18n.t("reports.days", default: "Kun"))"
        }
    }

    private var periodSheet: some View {
        NavigationStack {
            Form {
                Section(i18n.t("reports.period", default: "Muddat")) {
                    Picker(i18n.t("reports.period", default: "Period"), selection: $preset) {
                        Text(i18n.t("reports.today", default: "Today")).tag("today")
                        Text("7 \(i18n.t("reports.days", default: "Days"))").tag("7d")
                        Text("30 \(i18n.t("reports.days", default: "Days"))").tag("30d")
                    }
                    .pickerStyle(.segmented)
                    .disabled(range.isActive)
                }
                Section(i18n.t("reports.customRange", default: "Maxsus muddat")) {
                    KitDateRangeField(range: $range)
                }
            }
            .navigationTitle(i18n.t("reports.period", default: "Muddatni tanlash"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.done", default: "Tayyor")) { showPeriodSheet = false }
                }
            }
        }
        .presentationDetents([.height(300)])
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
        if range.isActive {
            let fmt = ISO8601DateFormatter()
            return (range.from.map(fmt.string(from:)), range.to.map(fmt.string(from:)))
        }
        let r = Self.range(for: preset)
        return (r.from, r.to)
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
