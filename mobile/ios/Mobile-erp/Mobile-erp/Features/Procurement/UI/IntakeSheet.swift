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
    @State private var results: [RegisteredDevice] = []
    @State private var busy = false
    @State private var error: String?

    private var canViewCost: Bool { container.session.can("device.cost.view") }

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
                            IntakeDeviceForm(models: list, onAdd: add,
                                             isDuplicate: { code in
                                                 drafts.contains { $0.imei == code || $0.imei2 == code }
                                             })
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
                if canViewCost, !results.isEmpty {
                    Section(i18n.t("shipments.landedCostResults")) {
                        ForEach(results) { r in
                            HStack {
                                Text(r.imei).font(.mono(13))
                                Spacer()
                                MoneyText(value: r.landedCost ?? "0", size: 13)
                            }
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
                    let repo = DeviceModelsRepository(api: container.api)
                    models = AsyncStore { try await repo.list() }
                }
                await models?.reload()
            }
        }
    }

    private func add(_ draft: IntakeDraft) {
        // A new unit collides when either of its IMEIs matches either IMEI of a staged one.
        let codes = [draft.imei, draft.imei2].compactMap { $0 }
        let collides = drafts.contains { d in
            codes.contains(d.imei) || (d.imei2.map(codes.contains) ?? false)
        }
        guard !collides else {
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
            results = try await ShipmentsRepository(api: container.api)
                .addDevices(shipment.id, drafts.map(\.dto))
            container.toasts.success(i18n.t("common.success"))
            drafts = []
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
