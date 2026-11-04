import SwiftUI

/// Devices awaiting inspection (`GET /devices?inspected=false`), paged with
/// load-more. Tap a row to grade that unit. Reloads when `refresh` changes
/// (external) or after a grade.
struct QcQueueView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    let onGraded: () -> Void

    @State private var pager: KitPaginator<ProcDevice>?
    @State private var modelNames: [String: String] = [:]
    @State private var grading: ScannedImei?

    var body: some View {
        VStack(spacing: 0) {
            ScannerField(placeholder: i18n.t("qc.scanPlaceholder")) { grading = ScannedImei(imei: $0) }
                .padding(.horizontal)
                .padding(.vertical, 8)

            content
        }
        .background(Tokens.bg)
        .navigationTitle(i18n.t("qc.tabQueue", default: "Tekshiruv navbati"))
        .navigationBarTitleDisplayMode(.inline)
        .task(id: refresh) {
            if pager == nil { pager = makePager() }
            await loadModels()
            await pager?.first()
        }
        .sheet(item: $grading, onDismiss: reload) { s in
            GradeDeviceSheet(imei: s.imei) { onGraded() }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let pager {
            if let error = pager.error, pager.items.isEmpty {
                ErrorStateView(message: error, retry: reload)
            } else if pager.items.isEmpty, !pager.isLoading {
                EmptyStateView(systemImage: "checkmark.seal", title: i18n.t("qc.queueEmpty"))
            } else {
                List {
                    ForEach(pager.items) { d in
                        QueueRow(device: d, modelName: modelNames[d.modelId] ?? d.modelId)
                            .contentShape(Rectangle())
                            .onTapGesture { grading = ScannedImei(imei: d.imei) }
                    }
                    KitLoadMoreFooter(pager: pager)
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .listRowBackground(Tokens.surface)
                .background(Tokens.bg)
            }
        } else {
            LoadingView()
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

private struct QueueRow: View {
    let device: ProcDevice
    let modelName: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(device.imei).font(.mono(13))
                if let imei2 = device.imei2, !imei2.isEmpty {
                    Text(imei2).font(.mono(11)).foregroundStyle(.tertiary)
                }
                Text("\(modelName) · \(device.statusCode)").font(.caption).foregroundStyle(Tokens.muted)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
        }
    }
}
