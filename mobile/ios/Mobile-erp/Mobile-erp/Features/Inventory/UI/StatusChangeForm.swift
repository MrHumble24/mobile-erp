import SwiftUI

/// Manual status-change form at the foot of the device sheet. Online-only (not
/// an outbox mutation): blocked with a connection message when offline.
/// Surfaces the 409 version conflict (ADR 0012). Kit fields, not a Form.
struct StatusChangeForm: View {
    let device: DeviceDetail
    let store: InventoryStore
    let onChanged: () async -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var target = ""
    @State private var reason = ""
    @State private var saving = false
    @State private var message: String?

    private var transitions: [String] { DeviceStatusMeta.transitions(for: device.statusCode) }
    private var online: Bool { container.connectivity.isOnline }

    var body: some View {
        if !transitions.isEmpty {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    Text(i18n.t("inventory.changeStatus")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                    Text(i18n.t("inventory.statusManualHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                AppFormField(label: i18n.t("inventory.newStatus")) {
                    AppSelect(placeholder: i18n.t("inventory.newStatus"), selection: $target,
                              options: transitions.map { ($0, i18n.t(DeviceStatusMeta.labelKey($0))) })
                }
                AppFormField(label: i18n.t("inventory.reason")) {
                    AppTextField(placeholder: i18n.t("inventory.reason"), text: $reason)
                }
                if let message {
                    Text(message).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                if !online {
                    Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
                Button {
                    Task { await submit() }
                } label: {
                    Text(saving ? i18n.t("common.loading") : i18n.t("common.save"))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillSecondary)
                .disabled(saving || !online || target.isEmpty)
            }
            .padding(.top, Tokens.Space.sm)
            .onAppear { if target.isEmpty { target = transitions.first ?? "" } }
        }
    }

    private func submit() async {
        guard !target.isEmpty else { return }
        saving = true
        message = nil
        defer { saving = false }
        do {
            try await DeviceRepository(container).changeStatus(
                id: device.id, toStatusCode: target,
                expectedVersion: device.version, reason: reason)
            reason = ""
            container.sync.syncNow()
            container.toasts.success(i18n.t("common.success"))
            await onChanged()
        } catch let error as AppError {
            message = error.statusCode == 409
                ? i18n.t("inventory.versionConflict")
                : error.message
            if error.statusCode == 409 { await onChanged() }
        } catch {
            message = i18n.t("common.error")
        }
    }
}
