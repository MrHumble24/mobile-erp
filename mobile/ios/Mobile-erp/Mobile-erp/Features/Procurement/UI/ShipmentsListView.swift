import SwiftUI

/// Shipment batches, newest-first. "New shipment" chains into device intake
/// once the batch is created. iPhone opens a detail sheet; iPad shows a
/// master-detail split.
struct ShipmentsListView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var store: AsyncStore<ShipmentsFeed>?
    @State private var showNew = false
    @State private var pendingIntake: Shipment?
    @State private var intakeShipment: Shipment?
    @State private var detail: Shipment?       // iPhone detail sheet
    @State private var selectedId: String?     // iPad split selection

    private var canManage: Bool { container.session.can("shipment.manage") }
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    var body: some View {
        Group {
            if let store {
                LoadableView(state: store.state, retry: reload) { feed in
                    if isPad { split(feed) } else { compact(feed) }
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
        .toolbar {
            if canManage && !isPad {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showNew = true
                    } label: {
                        Label(i18n.t("shipments.newShipment"), systemImage: "plus")
                    }
                }
            }
        }
    }

    // MARK: iPhone

    @ViewBuilder
    private func compact(_ feed: ShipmentsFeed) -> some View {
        if feed.shipments.isEmpty {
            emptyState
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
            .scrollContentBackground(.hidden)
            .listRowBackground(Tokens.surface)
            .background(Tokens.bg)
        }
    }

    // MARK: iPad

    private func split(_ feed: ShipmentsFeed) -> some View {
        NavigationSplitView {
            Group {
                if feed.shipments.isEmpty {
                    emptyState
                } else {
                    List(selection: $selectedId) {
                        ForEach(feed.shipments) { shipment in
                            ShipmentRow(shipment: shipment,
                                        supplierName: feed.supplierNames[shipment.supplierId] ?? shipment.supplierId)
                                .tag(shipment.id)
                        }
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                    .listRowBackground(Tokens.surface)
                    .background(Tokens.bg)
                }
            }
            .navigationTitle(i18n.t("shipments.title"))
            .toolbar {
                if canManage {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showNew = true } label: { Image(systemName: "plus") }
                    }
                }
            }
        } detail: {
            if let selected = feed.shipments.first(where: { $0.id == selectedId }) {
                ShipmentDetailSheet(shipment: selected, showsClose: false)
                    .id(selected.id)
            } else {
                ContentUnavailableView(i18n.t("shipments.detailTitle"), systemImage: "shippingbox")
            }
        }
    }

    private var emptyState: some View {
        EmptyStateView(systemImage: "shippingbox", title: i18n.t("shipments.emptyHint"))
            .frame(maxHeight: .infinity, alignment: .top)
            .padding(.top, 40)
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
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 5) {
                Text(supplierName)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Tokens.ink)
                Text("\(shipment.dateLabel) · " + i18n.t("shipments.registeredProgress", [
                    "registered": "\(shipment.deviceCount)", "expected": "\(shipment.expectedCount)",
                ]))
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            StatusBadge(
                i18n.t(shipment.isComplete ? "shipments.statusComplete" : "shipments.statusOpen"),
                color: shipment.isComplete ? Tokens.success : Tokens.warning
            )
        }
        .padding(.vertical, 4)
    }
}
