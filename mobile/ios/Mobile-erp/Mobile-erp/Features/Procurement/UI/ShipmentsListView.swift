import SwiftUI

/// Shipment batches, newest-first. "New shipment" chains into device intake
/// once the batch is created. Tapping a row opens its detail sheet.
struct ShipmentsListView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var store: AsyncStore<ShipmentsFeed>?
    @State private var showNew = false
    @State private var pendingIntake: Shipment?
    @State private var intakeShipment: Shipment?
    @State private var detail: Shipment?

    private var canManage: Bool { container.session.can("shipment.manage") }

    var body: some View {
        Group {
            if let store {
                LoadableView(state: store.state, retry: reload) { feed in
                    list(feed)
                }
            } else {
                LoadingView()
            }
        }
        .task {
            if store == nil { store = makeStore() }
            await store?.reload()
        }
        .sheet(isPresented: $showNew, onDismiss: afterNewDismiss) {
            ShipmentFormSheet(existing: nil) { created in pendingIntake = created }
        }
        .sheet(item: $intakeShipment, onDismiss: reload) { shipment in
            IntakeSheet(shipment: shipment)
        }
        .sheet(item: $detail, onDismiss: reload) { shipment in
            ShipmentDetailSheet(shipment: shipment)
        }
    }

    @ViewBuilder
    private func list(_ feed: ShipmentsFeed) -> some View {
        if feed.shipments.isEmpty {
            VStack(spacing: 16) {
                if canManage { newButton }
                EmptyStateView(systemImage: "shippingbox", title: i18n.t("shipments.emptyHint"))
            }
            .frame(maxHeight: .infinity, alignment: .top)
            .padding(.top)
        } else {
            List {
                ForEach(feed.shipments) { shipment in
                    ShipmentRow(shipment: shipment,
                                supplierName: feed.supplierNames[shipment.supplierId] ?? shipment.supplierId)
                        .contentShape(Rectangle())
                        .onTapGesture { detail = shipment }
                }
            }
            .listStyle(.insetGrouped)
            .safeAreaInset(edge: .top) {
                if canManage { newButton.padding(.horizontal).padding(.bottom, 4) }
            }
        }
    }

    private var newButton: some View {
        HStack {
            Spacer()
            Button { showNew = true } label: {
                Label(i18n.t("shipments.newShipment"), systemImage: "plus")
            }
            .buttonStyle(.borderedProminent)
            .tint(Tokens.ink)
        }
    }

    private func makeStore() -> AsyncStore<ShipmentsFeed> {
        let api = container.api
        let ships = ShipmentsRepository(api: api)
        let sups = SuppliersRepository(api: api)
        return AsyncStore {
            async let a = ships.list()
            async let b = sups.list()
            let (shipments, suppliers) = try await (a, b)
            let names = Dictionary(suppliers.map { ($0.id, $0.name) }, uniquingKeysWith: { l, _ in l })
            return ShipmentsFeed(shipments: shipments, supplierNames: names)
        }
    }

    private func afterNewDismiss() {
        if let created = pendingIntake {
            pendingIntake = nil
            intakeShipment = created   // chain into device intake
        } else {
            reload()
        }
    }

    private func reload() { Task { await store?.reload() } }
}

/// Shipments list + supplier-name map, loaded together.
struct ShipmentsFeed {
    let shipments: [Shipment]
    let supplierNames: [String: String]
}

private struct ShipmentRow: View {
    @Environment(I18n.self) private var i18n
    let shipment: Shipment
    let supplierName: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(supplierName).font(.body.weight(.medium))
                Text("\(shipment.dateLabel) · " + i18n.t("shipments.registeredProgress", [
                    "registered": "\(shipment.deviceCount)", "expected": "\(shipment.expectedCount)",
                ]))
                .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            StatusBadge(
                i18n.t(shipment.isComplete ? "shipments.statusComplete" : "shipments.statusOpen"),
                color: shipment.isComplete ? Tokens.success : Tokens.warning
            )
        }
    }
}
