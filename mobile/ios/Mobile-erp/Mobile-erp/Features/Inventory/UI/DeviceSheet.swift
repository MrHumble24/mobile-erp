import SwiftUI

/// Device detail sheet: resolves the full device online by IMEI (the offline
/// list caches only a subset), then shows specs, QC, history and the manual
/// status-change form. Online-only — offline shows a connection message.
struct DeviceSheet: View {
    let imei: String
    let store: InventoryStore
    /// Hidden when embedded as the detail column of the iPad split view.
    var showsClose = true

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
                if showsClose {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(i18n.t("common.close")) { dismiss() }
                    }
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

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    private var canSell: Bool {
        device.statusCode == "IN_STOCK" && container.session.can("sale.create")
    }
    private var canInspect: Bool {
        ["IN_STOCK", "DEFECTIVE"].contains(device.statusCode) && container.session.can("qc.create")
    }

    var body: some View {
        List {
            Section {
                DeviceSheetHeader(device: device, canEdit: canEdit, onEdit: onEdit)
                    .listRowBackground(Color.clear)
                DeviceBarcode(imei: device.imei)
                    .listRowBackground(Color.clear)
            }
            if canSell || canInspect {
                Section {
                    if canSell {
                        Button {
                            container.router.open(.pos(imei: device.imei))
                            dismiss()
                        } label: {
                            Label(i18n.t("inventory.sellInPos"), systemImage: "cart")
                        }
                        .tint(Tokens.success)
                    }
                    if canInspect {
                        Button {
                            container.router.open(.qc(imei: device.imei))
                            dismiss()
                        } label: {
                            Label(i18n.t("qc.runInspection"), systemImage: "checkmark.seal")
                        }
                    }
                }
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
        .scrollContentBackground(.hidden)
        .listRowBackground(Tokens.surface)
        .background(Tokens.bg)
    }
}

private struct DeviceSheetHeader: View {
    let device: DeviceDetail
    let canEdit: Bool
    let onEdit: () -> Void
    @Environment(I18n.self) private var i18n
    @State private var copied = false

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text("IMEI: \(device.imei)")
                        .font(.mono(13, weight: .medium))
                        .foregroundStyle(Tokens.ink)
                    Button {
                        UIPasteboard.general.string = device.imei
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        withAnimation(.snappy(duration: 0.2)) { copied = true }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            withAnimation { copied = false }
                        }
                    } label: {
                        Image(systemName: copied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(copied ? Tokens.success : .secondary)
                    }
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
                        .font(.subheadline.weight(.medium))
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(.vertical, 4)
    }
}
