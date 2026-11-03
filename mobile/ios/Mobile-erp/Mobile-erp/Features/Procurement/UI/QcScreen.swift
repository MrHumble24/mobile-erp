import SwiftUI

/// `/qc` root — dedicated hub for Quality Control.
/// Provides a fast IMEI scanner and dedicated sub-pages for Queue, Inspections History,
/// QC Statistics, and Reference Data (Lookups).
/// Mounted behind `qc.read` by the shell.
struct QcScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var scanned: ScannedImei?
    @State private var refresh = UUID()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Quick Scan Header
                ScannerField(placeholder: i18n.t("qc.scanPlaceholder")) { scanned = ScannedImei(imei: $0) }

                // Dedicated Sub-Pages Navigation
                VStack(spacing: 12) {
                    QcNavCard(
                        title: i18n.t("qc.tabQueue", default: "Tekshiruv navbati"),
                        subtitle: i18n.t("qc.queueSubtitle", default: "Tekshirilishi kerak bo'lgan yangi qurilmalar"),
                        icon: "clock.badge.checkmark",
                        iconColor: Tokens.signalBlue,
                        destination: QcQueueView(refresh: refresh) { refresh = UUID() }
                    )

                    QcNavCard(
                        title: i18n.t("qc.tabInspections", default: "Tekshiruvlar tarixi"),
                        subtitle: i18n.t("qc.inspectionsSubtitle", default: "O'tkazilgan tekshiruvlar va ularning natijalari"),
                        icon: "doc.text.magnifyingglass",
                        iconColor: Tokens.success,
                        destination: QcInspectionsView(refresh: refresh)
                    )

                    QcNavCard(
                        title: i18n.t("qc.tabStats", default: "QC Statistikasi"),
                        subtitle: i18n.t("qc.statsSubtitle", default: "Sifat ko'rsatkichlari va nuqsonlar tahlili"),
                        icon: "chart.bar.xaxis",
                        iconColor: Color(red: 0.55, green: 0.35, blue: 0.95),
                        destination: QcStatsView(refresh: refresh)
                    )

                    if container.session.can("settings.manage") {
                        QcNavCard(
                            title: i18n.t("qc.tabLookups", default: "Ma'lumotnomalar"),
                            subtitle: i18n.t("qc.lookupsSubtitle", default: "Holat darajalari va nuqson turlari boshqaruvi"),
                            icon: "slider.horizontal.3",
                            iconColor: Tokens.warning,
                            destination: QcLookupsView()
                        )
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
        .background(Tokens.bg)
        .navigationTitle(i18n.t("nav.qc"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            #if DEBUG
            ProcurementSelfCheck.runOnce()
            #endif
        }
        .onAppear(perform: consumeRoute)
        .onChange(of: container.router.pending) { consumeRoute() }
        .sheet(item: $scanned) { s in
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

/// A roomy, single-column navigation card linking to a dedicated sub-page.
private struct QcNavCard<Destination: View>: View {
    let title: String
    let subtitle: String
    let icon: String
    let iconColor: Color
    let destination: Destination

    var body: some View {
        NavigationLink(destination: destination) {
            AppCard(padding: 16) {
                HStack(spacing: 14) {
                    Image(systemName: icon)
                        .font(.title2.weight(.medium))
                        .foregroundStyle(iconColor)
                        .frame(width: 48, height: 48)
                        .background(iconColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 3) {
                        Text(title)
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(Tokens.ink)
                        Text(subtitle)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color(.tertiaryLabel))
                }
            }
        }
        .buttonStyle(.plain)
    }
}

/// Identifiable wrapper so re-scanning the same IMEI re-presents the sheet.
struct ScannedImei: Identifiable {
    let id = UUID()
    let imei: String
}
