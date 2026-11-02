import SwiftUI
import SwiftData

/// The inventory slice group: devices (offline list + detail/edit/status),
/// device models + attributes, and stock-alert rules — composed as tabs behind
/// one `device.read` nav entry. Registered with one line in `FeatureRegistry`.
enum InventoryModule {
    static let feature = FeatureModule(
        id: "inventory",
        labelKey: "nav.inventory",
        systemImage: "iphone",
        permission: "device.read",
        root: { AnyView(InventoryView()) }
    )
}

/// Root of the inventory section. Owns the slice's shared online store and
/// injects the SwiftData cache into the subtree so the devices list reads it
/// offline via `@Query`.
struct InventoryView: View {
    @Environment(AppContainer.self) private var container
    @State private var store: InventoryStore?

    var body: some View {
        Group {
            if let store {
                InventoryTabs(store: store)
            } else {
                LoadingView()
            }
        }
        .modelContainer(container.modelContainer)
        .task {
            #if DEBUG
            _ = InventorySelfCheck.ran
            #endif
            if store == nil { store = InventoryStore(container) }
            await store?.loadModels()
            await store?.loadLowStock()
        }
    }
}

private enum InventoryTab: String, CaseIterable, Identifiable {
    case devices, models, alerts
    var id: String { rawValue }
    var labelKey: String {
        switch self {
        case .devices: return "inventory.tabDevices"
        case .models: return "inventory.tabModels"
        case .alerts: return "inventory.tabAlerts"
        }
    }
}

private struct InventoryTabs: View {
    let store: InventoryStore
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var tab: InventoryTab = .devices

    private var tabs: [InventoryTab] {
        var all: [InventoryTab] = [.devices]
        if container.session.can("device.update") { all.append(.models) }
        all.append(.alerts)
        return all
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                ForEach(tabs) { Text(i18n.t($0.labelKey)).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.bottom, 8)

            switch tab {
            case .devices:
                DevicesTab(store: store, onShowAlerts: { tab = .alerts })
            case .models:
                DeviceModelsTab(store: store)
            case .alerts:
                StockAlertsTab(store: store)
            }
        }
        .navigationTitle(i18n.t("inventory.title"))
        .navigationBarTitleDisplayMode(.inline)
        .background(Color(.systemGroupedBackground))
    }
}
