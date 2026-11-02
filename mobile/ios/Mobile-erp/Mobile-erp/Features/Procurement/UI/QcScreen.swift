import SwiftUI

/// `/qc` root — a persistent scan header over four tabs: queue, inspections,
/// stats, lookups. Scanning an IMEI opens the grade sheet for that unit.
/// Mounted behind `qc.read` by the shell.
struct QcScreen: View {
    @Environment(I18n.self) private var i18n
    @State private var tab: Tab = .queue
    @State private var scanned: ScannedImei?
    @State private var refresh = UUID()

    private enum Tab: Hashable { case queue, inspections, stats, lookups }

    var body: some View {
        VStack(spacing: 0) {
            ScannerField(placeholder: i18n.t("qc.scanPlaceholder")) { scanned = ScannedImei(imei: $0) }
                .padding(.horizontal).padding(.top, 8)

            Picker("", selection: $tab) {
                Text(i18n.t("qc.tabQueue")).tag(Tab.queue)
                Text(i18n.t("qc.tabInspections")).tag(Tab.inspections)
                Text(i18n.t("qc.tabStats")).tag(Tab.stats)
                Text(i18n.t("qc.tabLookups")).tag(Tab.lookups)
            }
            .pickerStyle(.segmented)
            .padding()

            content
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(i18n.t("nav.qc"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            #if DEBUG
            ProcurementSelfCheck.runOnce()
            #endif
        }
        .sheet(item: $scanned) { s in
            GradeDeviceSheet(imei: s.imei) { refresh = UUID() }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch tab {
        case .queue: QcQueueView(refresh: refresh) { refresh = UUID() }
        case .inspections: QcInspectionsView(refresh: refresh)
        case .stats: QcStatsView(refresh: refresh)
        case .lookups: QcLookupsView()
        }
    }
}

/// Identifiable wrapper so re-scanning the same IMEI re-presents the sheet.
struct ScannedImei: Identifiable {
    let id = UUID()
    let imei: String
}
