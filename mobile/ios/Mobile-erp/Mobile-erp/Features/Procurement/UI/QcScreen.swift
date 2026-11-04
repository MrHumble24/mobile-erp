import SwiftUI

/// `/qc` root: the scan field, then three segments (queue / inspections /
/// stats) rendered inline — the Android `QcScreen`. The reference data
/// (grades, defect types) is a manager-only sub-page reached from a link card
/// under the queue, not a fourth segment: four labels truncate at phone width.
/// Mounted behind `qc.read` by the shell.
struct QcScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var scanned: ScannedImei?
    @State private var refresh = UUID()
    @State private var tab: QcTab = .queue

    private enum QcTab: Hashable { case queue, inspections, stats }

    var body: some View {
        VStack(spacing: Tokens.Space.md) {
            ScannerField(placeholder: i18n.t("qc.scanPlaceholder")) { scanned = ScannedImei(imei: $0) }
            SegmentedControl(selection: $tab, segments: [
                (.queue, i18n.t("qc.tabQueue")),
                (.inspections, i18n.t("qc.tabInspections")),
                (.stats, i18n.t("qc.tabStats")),
            ])
            switch tab {
            case .queue:
                QcQueueView(refresh: refresh, onGraded: { refresh = UUID() }) {
                    if container.session.can("settings.manage") {
                        NavigationLink { QcLookupsView() } label: {
                            AppCard {
                                HStack(spacing: Tokens.Space.sm) {
                                    Text(i18n.t("qc.tabLookups")).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                                    Spacer(minLength: Tokens.Space.sm)
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(Tokens.muted)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            case .inspections:
                QcInspectionsView(refresh: refresh)
            case .stats:
                QcStatsView(refresh: refresh)
            }
        }
        .padding(.horizontal, Tokens.Space.gutter)
        .padding(.top, Tokens.Space.md)
        .background(Tokens.ground)
        .navigationTitle(i18n.t("nav.qc"))
        .task {
            #if DEBUG
            ProcurementSelfCheck.runOnce()
            #endif
        }
        .onAppear(perform: consumeRoute)
        .onChange(of: container.router.pending) { consumeRoute() }
        #if DEBUG
        // Screenshot helpers: `-openTab inspections|stats`, `-openQcImei <imei>`.
        .onAppear {
            switch KitDebugLaunch.consume("openTab") {
            case "inspections": tab = .inspections
            case "stats": tab = .stats
            default: break
            }
            if let imei = KitDebugLaunch.consume("openQcImei"), scanned == nil {
                scanned = ScannedImei(imei: imei)
            }
        }
        #endif
        .appSheet(item: $scanned) { s in
            GradeDeviceSheet(imei: s.imei) { refresh = UUID() }
        }
    }

    /// Open the grade sheet for an IMEI handed over from another feature.
    private func consumeRoute() {
        if case let .qc(imei)? = container.router.consume("qc"), let imei {
            scanned = ScannedImei(imei: imei)
        }
    }
}

/// Identifiable wrapper so re-scanning the same IMEI re-presents the sheet.
struct ScannedImei: Identifiable {
    let id = UUID()
    let imei: String
}
