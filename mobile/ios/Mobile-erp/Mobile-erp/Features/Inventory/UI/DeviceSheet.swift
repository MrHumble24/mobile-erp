import SwiftUI

/// Device detail sheet: resolves the full device online by IMEI (the offline
/// list caches only a subset), then shows specs, QC, history and the manual
/// status-change form. Online-only — offline shows a connection message.
struct DeviceSheet: View {
    let imei: String
    let store: InventoryStore

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var detail: DeviceDetail?
    @State private var history: [DeviceHistoryEntry] = []
    @State private var error: AppError?
    @State private var loading = true
    @State private var editing = false

    private var repo: DeviceRepository { DeviceRepository(container) }

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    LoadingView()
                } else if let detail {
                    DeviceSheetBody(
                        device: detail,
                        history: history,
                        canViewCost: container.session.can("device.cost.view"),
                        canEdit: container.session.can("device.update"),
                        canChangeStatus: container.session.can("device.status.change"),
                        store: store,
                        onEdit: { editing = true },
                        onChanged: { await load() }
                    )
                } else {
                    ErrorStateView(message: error?.isNetwork == true
                                   ? i18n.t("common.offline", default: "No connection to the server.")
                                   : i18n.t("inventory.imeiNotFound"),
                                   retry: { Task { await load() } })
                }
            }
            .navigationTitle(detail?.modelLabel.isEmpty == false
                             ? detail!.modelLabel : i18n.t("inventory.imeiDetails"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
        }
        .task { await load() }
        .sheet(isPresented: $editing) {
            if let detail {
                EditDeviceSheet(device: detail, store: store, onSaved: { Task { await load() } })
            }
        }
    }

    private func load() async {
        loading = detail == nil
        do {
            let d = try await repo.detailByImei(imei)
            detail = d
            error = nil
            history = (try? await repo.history(d.id)) ?? []
        } catch let e as AppError {
            error = e
        } catch {
            self.error = AppError(statusCode: 0, message: error.localizedDescription)
        }
        loading = false
    }
}

private struct DeviceSheetBody: View {
    let device: DeviceDetail
    let history: [DeviceHistoryEntry]
    let canViewCost: Bool
    let canEdit: Bool
    let canChangeStatus: Bool
    let store: InventoryStore
    let onEdit: () -> Void
    let onChanged: () async -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        List {
            Section {
                DeviceSheetHeader(device: device, canEdit: canEdit, onEdit: onEdit)
                    .listRowBackground(Color.clear)
                DeviceBarcode(imei: device.imei)
                    .listRowBackground(Color.clear)
            }
            Section(i18n.t("inventory.storage")) {
                DeviceSpecsGrid(device: device, canViewCost: canViewCost)
                    .listRowBackground(Color.clear)
            }
            Section(i18n.t("inventory.qcInspection")) {
                QcSummarySection(qc: device.latestInspection)
            }
            Section(i18n.t("inventory.history")) {
                DeviceHistoryList(history: history)
            }
            if canChangeStatus {
                StatusChangeForm(device: device, store: store, onChanged: onChanged)
            }
        }
        .listStyle(.insetGrouped)
    }
}

private struct DeviceSheetHeader: View {
    let device: DeviceDetail
    let canEdit: Bool
    let onEdit: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("IMEI: \(device.imei)").font(.mono(12)).foregroundStyle(.secondary)
                    Button {
                        UIPasteboard.general.string = device.imei
                    } label: { Image(systemName: "doc.on.doc").font(.caption) }
                        .buttonStyle(.plain)
                        .accessibilityLabel(i18n.t("inventory.copyImei"))
                }
                StatusBadge(deviceStatus: device.statusCode,
                            label: i18n.t(DeviceStatusMeta.labelKey(device.statusCode)))
            }
            Spacer()
            if canEdit {
                Button(action: onEdit) {
                    Label(i18n.t("inventory.editDevice"), systemImage: "pencil")
                }
                .buttonStyle(.bordered)
            }
        }
    }
}
