import SwiftUI

/// Loop-add devices to a shipment, then POST the batch. Online-only write;
/// duplicate IMEIs are rejected before they reach the batch.
struct IntakeSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let shipment: Shipment

    @State private var models: AsyncStore<[DeviceModel]>?
    @State private var drafts: [IntakeDraft] = []
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(i18n.t("shipments.registeredProgress", [
                        "registered": "\(drafts.count)", "expected": "\(shipment.expectedCount)",
                    ]))
                    .font(.subheadline).foregroundStyle(.secondary)
                }
                Section(i18n.t("shipments.intakeDevices")) {
                    if let models {
                        LoadableView(state: models.state, retry: { Task { await models.reload() } }) { list in
                            IntakeDeviceForm(models: list, onAdd: add)
                        }
                    } else {
                        LoadingView()
                    }
                }
                if !drafts.isEmpty {
                    Section(i18n.t("shipments.deviceList")) {
                        ForEach(drafts) { draft in
                            DraftRow(draft: draft) { remove(draft) }
                        }
                    }
                }
                if let error {
                    Section { Text(error).foregroundStyle(Tokens.danger).font(.footnote) }
                }
            }
            .navigationTitle(i18n.t("shipments.intakeDevices"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("shipments.submitBatch")) { Task { await submit() } }
                        .disabled(busy || drafts.isEmpty)
                }
            }
            .task {
                if models == nil {
                    let repo = DeviceModelsRepository(api: ProcApi(container))
                    models = AsyncStore { try await repo.list() }
                }
                await models?.reload()
            }
        }
    }

    private func add(_ draft: IntakeDraft) {
        guard !drafts.contains(where: { $0.imei == draft.imei }) else {
            error = i18n.t("shipments.duplicateImei"); return
        }
        drafts.append(draft)
        error = nil
    }

    private func remove(_ draft: IntakeDraft) {
        drafts.removeAll { $0.id == draft.id }
    }

    private func submit() async {
        guard !drafts.isEmpty else { return }
        if let message = offlineBlock(container, i18n) { error = message; return }
        busy = true
        defer { busy = false }
        error = nil
        do {
            try await ShipmentsRepository(api: ProcApi(container))
                .addDevices(shipment.id, drafts.map(\.dto))
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("shipments.duplicateImei") : e.message
        } catch let other {
            error = other.localizedDescription
        }
    }
}

private struct DraftRow: View {
    let draft: IntakeDraft
    let onRemove: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(draft.imei).font(.mono(13))
                if !draft.specsSummary.isEmpty {
                    Text(draft.specsSummary).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            Button(role: .destructive, action: onRemove) {
                Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
            }
            .buttonStyle(.borderless)
        }
    }
}
