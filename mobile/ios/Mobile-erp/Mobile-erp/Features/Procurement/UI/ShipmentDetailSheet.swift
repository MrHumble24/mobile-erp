import SwiftUI

/// Shipment summary + its registered devices (paged with load-more), with edit
/// and continue-intake actions.
struct ShipmentDetailSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let shipment: Shipment
    /// Hidden when embedded as the detail column of the iPad split view.
    var showsClose = true

    @State private var pager: KitPaginator<ProcDevice>?
    @State private var modelNames: [String: String] = [:]
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
                    .font(.subheadline).foregroundStyle(Tokens.muted)
                    if let code = shipment.paymentAccountCode {
                        HStack {
                            Text(i18n.t("balance.payFrom")).foregroundStyle(Tokens.muted)
                            Spacer()
                            Text(PaymentAccounts.label(code, i18n)).foregroundStyle(Tokens.text)
                        }
                        .font(.subheadline)
                    }
                    if let total = shipment.unitExpenseTotal {
                        totalRow(i18n.t("shipments.unitExpenseTotal"), total)
                    }
                    if let total = shipment.customsFeeTotal {
                        totalRow(i18n.t("shipments.customsFeeTotal"), total)
                    }
                    if shipment.devicesWithoutCustomsFee > 0 {
                        Label(i18n.t("shipments.devicesWithoutCustomsFee",
                                     ["count": "\(shipment.devicesWithoutCustomsFee)"]),
                              systemImage: "exclamationmark.triangle")
                            .font(.subheadline)
                            .foregroundStyle(Tokens.warning)
                    }
                    actions
                }
                Section(i18n.t("shipments.deviceList")) {
                    devices
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .listRowBackground(Tokens.surface)
            .background(Tokens.bg)
            .navigationTitle(i18n.t("shipments.detailTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if showsClose {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(i18n.t("common.cancel", default: "Done")) { dismiss() }
                    }
                }
            }
            .task {
                if pager == nil { pager = makePager() }
                await loadModels()
                await pager?.first()
            }
            .sheet(item: $editShipment, onDismiss: reload) { s in
                ShipmentFormSheet(existing: s)
            }
            .sheet(item: $intake, onDismiss: reload) { s in
                IntakeSheet(shipment: s)
            }
        }
    }

    private func totalRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(Tokens.muted)
            Spacer()
            MoneyText(value: value, size: 15)
        }
        .font(.subheadline)
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
        if let pager {
            if let error = pager.error, pager.items.isEmpty {
                ErrorStateView(message: error, retry: reload)
            } else if pager.items.isEmpty, !pager.isLoading {
                Text(i18n.t("shipments.noDevices")).foregroundStyle(Tokens.muted)
            } else {
                let showCost = pager.items.contains { $0.landedCost != nil }
                ForEach(pager.items) { d in
                    DeviceTableRow(device: d,
                                   modelName: modelNames[d.modelId] ?? d.modelId,
                                   showCost: showCost)
                }
                KitLoadMoreFooter(pager: pager)
            }
        } else {
            LoadingView()
        }
    }

    private func makePager() -> KitPaginator<ProcDevice> {
        let repo = DevicesRepository(api: container.api)
        let id = shipment.id
        return KitPaginator { page, size in
            let r = try await repo.query(shipmentId: id, page: page, pageSize: size)
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

private struct DeviceTableRow: View {
    @Environment(I18n.self) private var i18n
    let device: ProcDevice
    let modelName: String
    let showCost: Bool

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text(device.unitCode).font(.mono(13))
                Text(modelName).font(.caption).foregroundStyle(Tokens.muted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                StatusBadge(deviceStatus: device.statusCode,
                            label: i18n.t(DeviceStatusMeta.labelKey(device.statusCode)))
                if showCost, let cost = device.landedCost {
                    MoneyText(value: cost, size: 12)
                }
            }
        }
    }
}
