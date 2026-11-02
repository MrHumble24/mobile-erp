import SwiftUI

/// Shipment summary + its registered devices, with edit and continue-intake
/// actions. Shows the first page of devices (batches rarely exceed 50).
struct ShipmentDetailSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let shipment: Shipment

    @State private var store: AsyncStore<DeviceTableData>?
    @State private var editShipment: Shipment?
    @State private var intake: Shipment?

    private var canManage: Bool { container.session.can("shipment.manage") }
    private var canIntake: Bool { container.session.can("device.create") }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text(i18n.t("shipments.registeredProgress", [
                        "registered": "\(shipment.deviceCount)", "expected": "\(shipment.expectedCount)",
                    ]))
                    .font(.subheadline).foregroundStyle(.secondary)
                    actions
                }
                Section(i18n.t("shipments.deviceList")) {
                    devices
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(i18n.t("shipments.detailTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.cancel", default: "Done")) { dismiss() }
                }
            }
            .task {
                if store == nil { store = makeStore() }
                await store?.reload()
            }
            .sheet(item: $editShipment, onDismiss: reload) { s in
                ShipmentFormSheet(existing: s)
            }
            .sheet(item: $intake, onDismiss: reload) { s in
                IntakeSheet(shipment: s)
            }
        }
    }

    @ViewBuilder
    private var actions: some View {
        if canManage {
            Button(role: .none) { editShipment = shipment } label: {
                Label(i18n.t("shipments.editShipment"), systemImage: "pencil")
            }
        }
        if canIntake {
            Button { intake = shipment } label: {
                Label(i18n.t("shipments.continueIntake"), systemImage: "plus")
            }
        }
    }

    @ViewBuilder
    private var devices: some View {
        if let store {
            LoadableView(state: store.state, retry: reload) { data in
                if data.page.items.isEmpty {
                    Text(i18n.t("shipments.noDevices")).foregroundStyle(.secondary)
                } else {
                    let showCost = data.page.items.contains { $0.landedCost != nil }
                    ForEach(data.page.items) { d in
                        DeviceTableRow(device: d,
                                       modelName: data.modelNames[d.modelId] ?? d.modelId,
                                       showCost: showCost)
                    }
                }
            }
        } else {
            LoadingView()
        }
    }

    private func makeStore() -> AsyncStore<DeviceTableData> {
        let api = container.api
        let devices = DevicesRepository(api: api)
        let models = DeviceModelsRepository(api: api)
        let id = shipment.id
        return AsyncStore {
            async let a = devices.query(shipmentId: id)
            async let b = models.list()
            let (page, modelList) = try await (a, b)
            let names = Dictionary(modelList.map { ($0.id, $0.label) }, uniquingKeysWith: { l, _ in l })
            return DeviceTableData(page: page, modelNames: names)
        }
    }

    private func reload() { Task { await store?.reload() } }
}

struct DeviceTableData {
    let page: PaginatedDevices
    let modelNames: [String: String]
}

private struct DeviceTableRow: View {
    @Environment(I18n.self) private var i18n
    let device: ProcDevice
    let modelName: String
    let showCost: Bool

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text(device.imei).font(.mono(13))
                Text(modelName).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                StatusBadge(deviceStatus: device.statusCode, label: device.statusCode)
                if showCost, let cost = device.landedCost {
                    MoneyText(value: cost, size: 12)
                }
            }
        }
    }
}
