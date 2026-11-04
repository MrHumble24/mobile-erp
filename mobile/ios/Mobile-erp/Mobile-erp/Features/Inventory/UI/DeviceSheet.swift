import SwiftUI

/// Device detail as a Warm Card sheet: resolves the full device online by IMEI
/// (the offline list caches only a subset), then shows the device block (model,
/// IMEIs with copy, status pill), the actions, barcode, specs, QC, history and
/// the manual status-change form. Online-only — offline shows a connection
/// message. On iPad it is the detail column, with no close button.
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
                if loading {
                    LoadingView().frame(height: 160)
                } else if let detail {
                    DeviceSheetBody(
                        device: detail,
                        history: history,
                        canViewCost: container.session.can("device.cost.view"),
                        canEdit: container.session.can("device.update"),
                        canChangeStatus: container.session.can("device.status.change"),
                        showsClose: showsClose,
                        store: store,
                        onEdit: { editing = true },
                        onChanged: { await load() }
                    )
                } else {
                    ErrorStateView(message: error?.isNetwork == true
                                   ? i18n.t("common.offline", default: "Offline")
                                   : i18n.t("inventory.imeiNotFound"),
                                   retry: { Task { await load() } })
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(showsClose ? Tokens.card : Tokens.ground)
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
    let showsClose: Bool
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
        header
        if canSell || canInspect || canEdit { actions }
        DeviceBarcode(imei: device.imei)
        DeviceSpecsGrid(device: device, canViewCost: canViewCost)
        section(i18n.t("inventory.qcInspection")) { QcSummarySection(qc: device.latestInspection) }
        section(i18n.t("inventory.history")) { DeviceHistoryList(history: history) }
        if canChangeStatus {
            StatusChangeForm(device: device, store: store, onChanged: onChanged)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                Text(device.modelLabel.isEmpty ? i18n.t("inventory.imeiDetails") : device.modelLabel)
                    .font(.ui(.title))
                    .foregroundStyle(Tokens.text)
                Spacer(minLength: Tokens.Space.sm)
                if showsClose {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Tokens.text)
                            .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                            .background(Tokens.surface2, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("common.close"))
                }
            }
            CopyableIMEI(label: "IMEI", value: device.imei, accessibilityLabel: i18n.t("inventory.copyImei"))
            if let imei2 = device.imei2, !imei2.isEmpty {
                CopyableIMEI(label: i18n.t("inventory.imei2"), value: imei2, accessibilityLabel: i18n.t("inventory.copyImei"))
            }
            StatusBadge(deviceStatus: device.statusCode,
                        label: i18n.t(DeviceStatusMeta.labelKey(device.statusCode)))
        }
    }

    /// Sell is the one orange; QC is secondary; edit is a ghost link.
    private var actions: some View {
        VStack(spacing: Tokens.Space.sm) {
            if canSell {
                pill(i18n.t("inventory.sellInPos"), .pillPrimary) {
                    container.router.open(.pos(imei: device.imei))
                    dismiss()
                }
            }
            if canInspect {
                pill(i18n.t("qc.runInspection"), .pillSecondary) {
                    container.router.open(.qc(imei: device.imei))
                    dismiss()
                }
            }
            if canEdit { pill(i18n.t("inventory.editDevice"), .pillGhost, action: onEdit) }
        }
    }

    private func pill(_ title: String, _ style: PillButton, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(title).frame(maxWidth: .infinity) }
            .buttonStyle(style)
    }

    private func section<C: View>(_ title: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(title).font(.ui(.heading)).foregroundStyle(Tokens.text)
            content()
        }
    }
}
