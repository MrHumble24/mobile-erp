import SwiftUI
import SwiftData
import VisionKit

/// Devices tab: offline-first list from the SwiftData cache with metrics,
/// search (IMEI / model), model + storage filters and a camera scan. iPhone
/// opens the online detail as a sheet; iPad shows a master-detail split. Also
/// consumes an incoming `.inventory(imei:)` route from another feature.
@MainActor
struct DevicesTab: View {
    let store: InventoryStore
    let onShowAlerts: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Query(sort: \DeviceEntity.imei) private var cached: [DeviceEntity]
    @State private var filter = DeviceFilter()
    @State private var selected: ImeiTarget?
    @State private var selectedImei: String?
    @State private var showCamera = false
    @State private var showFilters = false

    private var all: [DeviceListItem] { cached.map(DeviceListItem.init) }
    private var shown: [DeviceListItem] { all.filter(filter.matches) }
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    /// Sheet filters only: status is the inline chip row, search the search bar.
    private var hasActiveFilters: Bool { filter.modelId != nil || filter.storage != nil }

    private var cameraSupported: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        Group {
            if isPad { splitBody } else { compactBody }
        }
        .onAppear(perform: consumeRoute)
        .onChange(of: container.router.pending) { consumeRoute() }
    }

    // MARK: iPhone — list + detail sheet

    private var compactBody: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if shown.isEmpty {
                    AppCard { EmptyStateView(systemImage: "iphone.slash", title: i18n.t("inventory.empty")) }
                } else {
                    ForEach(shown) { device in
                        Button { selected = ImeiTarget(imei: device.imei) } label: {
                            AppCard { DeviceListRow(device: device) }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            InventoryMetricsBar(
                metrics: DeviceMetrics(all),
                lowStockCount: store.lowStock.count,
                selectedStatus: filter.statusCode,
                onSelectStatus: { filter.statusCode = $0 },
                onShowAlerts: onShowAlerts
            )
            .padding(.bottom, Tokens.Space.md)
            .background(Tokens.ground)
        }
        .background(Tokens.ground)
        .searchable(text: $filter.search, prompt: i18n.t("inventory.scanOrSearch"))
        .toolbar { toolbarItems }
        .sheet(isPresented: $showFilters) { filterSheet }
        .appSheet(item: $selected) { target in
            DeviceSheet(imei: target.imei, store: store)
        }
        .sheet(isPresented: $showCamera) { camera }
        #if DEBUG
        // Screenshot helper: `-openDevice <imei>` opens that device's detail.
        .onAppear {
            if let imei = KitDebugLaunch.consume("openDevice"), selected == nil {
                selected = ImeiTarget(imei: imei)
            }
        }
        #endif
    }

    // MARK: iPad — master-detail

    private var splitBody: some View {
        NavigationSplitView {
            List(selection: $selectedImei) {
                Section {
                    if shown.isEmpty {
                        EmptyStateView(systemImage: "iphone.slash", title: i18n.t("inventory.empty"))
                            .listRowBackground(Color.clear)
                    } else {
                        ForEach(shown) { device in
                            DeviceListRow(device: device).tag(device.imei)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .listRowBackground(Tokens.surface)
            .background(Tokens.bg)
            .searchable(text: $filter.search, prompt: i18n.t("inventory.scanOrSearch"))
            .toolbar { toolbarItems }
            .navigationTitle(i18n.t("inventory.tabDevices"))
        } detail: {
            if let selectedImei {
                DeviceSheet(imei: selectedImei, store: store, showsClose: false)
                    .id(selectedImei)
            } else {
                ContentUnavailableView(i18n.t("inventory.imeiDetails"), systemImage: "iphone")
            }
        }
        .sheet(isPresented: $showCamera) { camera }
        .sheet(isPresented: $showFilters) { filterSheet }
    }

    private var filterSheet: some View {
        DeviceFilterSheet(filter: $filter, models: store.deviceModels)
    }

    @ToolbarContentBuilder
    private var toolbarItems: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { showFilters = true } label: {
                Label(i18n.t("common.filter"),
                      systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
            }
        }
        scanButton
    }

    @ToolbarContentBuilder
    private var scanButton: some ToolbarContent {
        if cameraSupported {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCamera = true } label: { Image(systemName: "barcode.viewfinder") }
            }
        }
    }

    private var camera: some View {
        CameraScanner { code in
            showCamera = false
            filter.search = code
        }
        .ignoresSafeArea()
    }

    /// Open the device handed over from another feature (`.inventory(imei:)`).
    private func consumeRoute() {
        guard case let .inventory(imei)? = container.router.consume("inventory"), let imei else { return }
        if isPad { selectedImei = imei } else { selected = ImeiTarget(imei: imei) }
    }
}

/// One device card: model, mono "IMEI · storage", optional IMEI 2, status pill —
/// the Android `DeviceRow`.
private struct DeviceListRow: View {
    let device: DeviceListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(device.modelLabel.isEmpty ? device.imei : device.modelLabel)
                    .font(.ui(.bodyStrong))
                    .foregroundStyle(Tokens.text)
                Text(device.storage.map { "\(device.imei) · \($0)" } ?? device.imei)
                    .font(.data(.regular))
                    .foregroundStyle(Tokens.text)
                if let imei2 = device.imei2, !imei2.isEmpty {
                    Text(imei2).font(.data(.regular)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer(minLength: Tokens.Space.sm)
            StatusBadge(deviceStatus: device.statusCode,
                        label: i18n.t(DeviceStatusMeta.labelKey(device.statusCode)))
        }
    }
}

private struct ImeiTarget: Identifiable {
    let imei: String
    var id: String { imei }
}
