import SwiftUI

/// Devices awaiting inspection (`GET /devices?inspected=false`). Tap a row to
/// grade that unit. Reloads when `refresh` changes (external) or after a grade.
struct QcQueueView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    let refresh: UUID
    let onGraded: () -> Void

    @State private var store: AsyncStore<DeviceTableData>?
    @State private var grading: ScannedImei?

    var body: some View {
        Group {
            if let store {
                LoadableView(state: store.state, retry: reload) { data in
                    if data.page.items.isEmpty {
                        EmptyStateView(systemImage: "checkmark.seal", title: i18n.t("qc.queueEmpty"))
                    } else {
                        List {
                            ForEach(data.page.items) { d in
                                QueueRow(device: d, modelName: data.modelNames[d.modelId] ?? d.modelId)
                                    .contentShape(Rectangle())
                                    .onTapGesture { grading = ScannedImei(imei: d.imei) }
                            }
                        }
                        .listStyle(.insetGrouped)
                    }
                }
            } else {
                LoadingView()
            }
        }
        .task(id: refresh) {
            if store == nil { store = makeStore() }
            await store?.reload()
        }
        .sheet(item: $grading, onDismiss: reload) { s in
            GradeDeviceSheet(imei: s.imei) { onGraded() }
        }
    }

    private func makeStore() -> AsyncStore<DeviceTableData> {
        let api = container.api
        let devices = DevicesRepository(api: api)
        let models = DeviceModelsRepository(api: api)
        return AsyncStore {
            async let a = devices.query(inspected: "false")
            async let b = models.list()
            let (page, modelList) = try await (a, b)
            let names = Dictionary(modelList.map { ($0.id, $0.label) }, uniquingKeysWith: { l, _ in l })
            return DeviceTableData(page: page, modelNames: names)
        }
    }

    private func reload() { Task { await store?.reload() } }
}

private struct QueueRow: View {
    let device: ProcDevice
    let modelName: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(device.imei).font(.mono(13))
                Text("\(modelName) · \(device.statusCode)").font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
        }
    }
}
