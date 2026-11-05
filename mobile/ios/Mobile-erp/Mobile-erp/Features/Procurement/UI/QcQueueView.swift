import SwiftUI

/// Devices awaiting inspection (`GET /devices?inspected=false`) as white cards
/// (model, mono IMEI, status pill), paged with load-more. Tap a row to grade
/// that unit. Reloads when `refresh` changes (external) or after a grade.
/// `footer` renders after the list — the manager's reference-data link.
struct QcQueueView<Footer: View>: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    let onGraded: () -> Void
    @ViewBuilder var footer: () -> Footer

    @State private var pager: KitPaginator<ProcDevice>?
    @State private var modelNames: [String: String] = [:]
    @State private var grading: ScannedImei?

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                content
                footer()
            }
            .padding(.bottom, Tokens.Space.lg)
        }
        .task(id: refresh) {
            if pager == nil { pager = makePager() }
            await loadModels()
            await pager?.first()
        }
        .appSheet(item: $grading, onDismiss: reload) { s in
            GradeDeviceSheet(imei: s.imei) { onGraded() }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let pager {
            if let error = pager.error, pager.items.isEmpty {
                AppCard { ErrorStateView(message: error, retry: reload) }
            } else if pager.items.isEmpty, !pager.isLoading {
                AppCard { EmptyStateView(systemImage: "checkmark.seal", title: i18n.t("qc.queueEmpty")) }
            } else {
                ForEach(pager.items) { d in
                    Button { grading = ScannedImei(imei: d.unitCode) } label: {
                        AppCard {
                            HStack(spacing: Tokens.Space.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(modelNames[d.modelId] ?? d.modelId).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                                    Text(d.unitCode).font(.data(.regular)).foregroundStyle(Tokens.text)
                                    if let imei2 = d.imei2, !imei2.isEmpty {
                                        Text(imei2).font(.data(.regular)).foregroundStyle(Tokens.muted)
                                    }
                                }
                                Spacer(minLength: Tokens.Space.sm)
                                StatusBadge(deviceStatus: d.statusCode,
                                            label: i18n.t(DeviceStatusMeta.labelKey(d.statusCode)))
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
                KitLoadMoreFooter(pager: pager)
            }
        } else {
            AppCard { LoadingView().frame(height: 120) }
        }
    }

    private func makePager() -> KitPaginator<ProcDevice> {
        let repo = DevicesRepository(api: container.api)
        return KitPaginator { page, size in
            let r = try await repo.query(inspected: "false", page: page, pageSize: size)
            return (r.items, r.total)
        }
    }

    private func loadModels() async {
        guard modelNames.isEmpty else { return }
        let models = (try? await DeviceModelsRepository(api: container.api).list()) ?? []
        modelNames = Dictionary(models.map { ($0.id, $0.label) }, uniquingKeysWith: { l, _ in l })
    }

    private func reload() { Task { await pager?.first() } }
}
