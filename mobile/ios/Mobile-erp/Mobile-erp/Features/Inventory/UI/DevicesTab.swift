import SwiftUI
import SwiftData
import VisionKit

/// Devices tab: offline-first list from the SwiftData cache with metrics,
/// search (IMEI / model), model + storage filters and a camera scan. Rows open
/// the online detail sheet.
@MainActor
struct DevicesTab: View {
    let store: InventoryStore
    let onShowAlerts: () -> Void

    @Environment(I18n.self) private var i18n
    @Query(sort: \DeviceEntity.imei) private var cached: [DeviceEntity]
    @State private var filter = DeviceFilter()
    @State private var selected: ImeiTarget?
    @State private var showCamera = false
    @State private var showFilters = false

    private var all: [DeviceListItem] { cached.map(DeviceListItem.init) }
    private var shown: [DeviceListItem] { all.filter(filter.matches) }

    private var hasActiveFilters: Bool {
        !filter.isEmpty || filter.statusCode != nil
    }

    private var cameraSupported: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        List {
            Section {
                if shown.isEmpty {
                    EmptyStateView(systemImage: "iphone.slash",
                                   title: i18n.t("inventory.empty"))
                        .listRowBackground(Color.clear)
                } else {
                    ForEach(shown) { device in
                        Button { selected = ImeiTarget(imei: device.imei) } label: {
                            DeviceListRow(device: device)
                        }
                        .tint(.primary)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .searchable(text: $filter.search, prompt: i18n.t("inventory.scanOrSearch"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showFilters = true
                } label: {
                    Label(i18n.t("common.filter", default: "Filters & Overview"),
                          systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                }
            }
            if cameraSupported {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCamera = true } label: { Image(systemName: "barcode.viewfinder") }
                }
            }
        }
        .sheet(isPresented: $showFilters) {
            DeviceFilterSheet(
                filter: $filter,
                metrics: DeviceMetrics(all),
                lowStockCount: store.lowStock.count,
                models: store.deviceModels,
                onShowAlerts: onShowAlerts
            )
        }
        .sheet(item: $selected) { target in
            DeviceSheet(imei: target.imei, store: store)
        }
        .sheet(isPresented: $showCamera) {
            CameraScanner { code in
                showCamera = false
                filter.search = code
            }
            .ignoresSafeArea()
        }
    }
}

private struct DeviceListRow: View {
    let device: DeviceListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(device.modelLabel.isEmpty ? device.imei : device.modelLabel)
                    .font(.body.weight(.medium))
                    .foregroundStyle(Tokens.ink)
                Text(device.storage.map { "\(device.imei) · \($0)" } ?? device.imei)
                    .font(.mono(12))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            StatusBadge(deviceStatus: device.statusCode,
                        label: i18n.t(DeviceStatusMeta.labelKey(device.statusCode)))
        }
        .padding(.vertical, 2)
    }
}

private struct ImeiTarget: Identifiable {
    let imei: String
    var id: String { imei }
}
