import SwiftUI

/// Manual status-change form inside the device sheet. Online-only (not an
/// outbox mutation): blocked with a connection message when offline. Surfaces
/// the 409 version conflict (ADR 0012). Rendered as List sections.
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
            Section {
                Picker(i18n.t("inventory.newStatus"), selection: $target) {
                    ForEach(transitions, id: \.self) { s in
                        Text(i18n.t(DeviceStatusMeta.labelKey(s))).tag(s)
                    }
                }
                TextField(i18n.t("inventory.reason"), text: $reason)
                if !online {
                    Label(i18n.t("common.offline", default: "No connection to the server."),
                          systemImage: "wifi.slash")
                        .font(.caption).foregroundStyle(Tokens.warning)
                }
                if let message {
                    Text(message).font(.caption).foregroundStyle(Tokens.danger)
                }
                Button {
                    Task { await submit() }
                } label: {
                    Text(saving ? i18n.t("common.loading") : i18n.t("common.save"))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(saving || !online || target.isEmpty)
            } header: {
                Text(i18n.t("inventory.changeStatus"))
            } footer: {
                Text(i18n.t("inventory.statusManualHint"))
            }
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
