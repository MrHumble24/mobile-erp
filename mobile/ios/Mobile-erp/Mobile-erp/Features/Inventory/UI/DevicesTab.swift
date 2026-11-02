import SwiftUI
import SwiftData
import VisionKit

/// Devices tab: offline-first list from the SwiftData cache with metrics,
/// search (IMEI / model), model + storage filters and a camera scan. Rows open
/// the online detail sheet.
struct DevicesTab: View {
    let store: InventoryStore
    let onShowAlerts: () -> Void

    @Environment(I18n.self) private var i18n
    @Query(sort: \DeviceEntity.imei) private var cached: [DeviceEntity]
    @State private var filter = DeviceFilter()
    @State private var selected: ImeiTarget?
    @State private var showCamera = false

    private var all: [DeviceListItem] { cached.map(DeviceListItem.init) }
    private var shown: [DeviceListItem] { all.filter(filter.matches) }

    private var cameraSupported: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        List {
            Section {
                InventoryMetricsBar(
                    metrics: DeviceMetrics(all),
                    lowStockCount: store.lowStock.count,
                    selectedStatus: filter.statusCode,
                    onSelectStatus: { filter.statusCode = $0 },
                    onShowAlerts: onShowAlerts
                )
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)
            }
            Section {
                FilterControls(filter: $filter, models: store.deviceModels)
                    .listRowBackground(Color.clear)
            }
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
            if cameraSupported {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCamera = true } label: { Image(systemName: "barcode.viewfinder") }
                }
            }
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

/// Model + storage dropdowns and a clear button, over the cached list.
private struct FilterControls: View {
    @Binding var filter: DeviceFilter
    let models: [DeviceModelView]
    @Environment(I18n.self) private var i18n

    private let storages = ["64GB", "128GB", "256GB", "512GB", "1TB"]

    var body: some View {
        HStack {
            Menu {
                Picker("", selection: $filter.modelId) {
                    Text(i18n.t("inventory.allModels")).tag(String?.none)
                    ForEach(models) { Text($0.label).tag(String?.some($0.id)) }
                }
            } label: {
                FilterLabel(text: filter.modelId.map(labelFor) ?? i18n.t("inventory.filterModel"))
            }
            Menu {
                Picker("", selection: $filter.storage) {
                    Text(i18n.t("inventory.allStorages")).tag(String?.none)
                    ForEach(storages, id: \.self) { Text($0).tag(String?.some($0)) }
                }
            } label: {
                FilterLabel(text: filter.storage ?? i18n.t("inventory.filterStorage"))
            }
            Spacer()
            if !filter.isEmpty {
                Button { filter = DeviceFilter() } label: {
                    Label(i18n.t("inventory.clearFilters"), systemImage: "arrow.counterclockwise")
                        .labelStyle(.iconOnly)
                }
                .buttonStyle(.bordered)
            }
        }
    }

    private func labelFor(_ id: String) -> String {
        models.first { $0.id == id }?.label ?? i18n.t("inventory.filterModel")
    }
}

private struct FilterLabel: View {
    let text: String
    var body: some View {
        HStack(spacing: 4) {
            Text(text).lineLimit(1)
            Image(systemName: "chevron.down").font(.caption2)
        }
        .font(.subheadline)
    }
}

private struct ImeiTarget: Identifiable {
    let imei: String
    var id: String { imei }
}
