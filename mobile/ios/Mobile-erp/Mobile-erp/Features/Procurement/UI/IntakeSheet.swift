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
    private var canSetExpense: Bool { container.session.can("device.expense") }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Form {
                    Section {
                        Text(i18n.t("shipments.registeredProgress", [
                            "registered": "\(drafts.count)", "expected": "\(shipment.expectedCount)",
                        ]))
                        .font(.subheadline).foregroundStyle(Tokens.muted)
                    }
                    Section(i18n.t("shipments.intakeDevices")) {
                        if let models {
                            LoadableView(state: models.state, retry: { Task { await models.reload() } }) { list in
                                IntakeDeviceForm(models: list, onAdd: add,
                                                 isDuplicate: { code in
                                                     drafts.contains { $0.imei == code || $0.imei2 == code }
                                                 },
                                                 canSetExpense: canSetExpense)
                            }
                        } else {
                            LoadingView()
                        }
                    }
                    if canViewCost, !results.isEmpty {
                        Section(i18n.t("shipments.landedCostResults")) {
                            ForEach(results) { r in
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack {
                                        Text(r.imei).font(.mono(13))
                                        Spacer()
                                        MoneyText(value: r.landedCost ?? "0", size: 13)
                                    }
                                    if let fee = r.customsFee {
                                        HStack {
                                            Text(i18n.t("inventory.customsFee")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                                            Spacer()
                                            MoneyText(value: fee, size: 12).foregroundStyle(Tokens.muted)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if let error {
                        Section { Text(error).foregroundStyle(Tokens.danger).font(.footnote) }
                    }
                }
                // Staged units: their own card column (the Kassa cart pattern), so
                // the capture spring dims only this list for one beat — never the
                // batch-default inputs in the Form above.
                if !drafts.isEmpty { stagedColumn }
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

    /// The staged scanned units as a card column with its own dim beat.
    private var stagedColumn: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("shipments.deviceList"))
                .font(.ui(.caption))
                .foregroundStyle(Tokens.muted)
                .padding(.horizontal, Tokens.Space.gutter)
            ScrollView {
                VStack(spacing: Tokens.Space.md) {
                    ForEach(drafts) { draft in
                        DraftCard(label: modelLabel(draft),
                                  cost: canViewCost ? draft.acquisitionCost : nil,
                                  draft: draft) { remove(draft) }
                            .captureSpringRow()
                    }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            }
            .captureSpringList(drafts.map(\.id), count: drafts.count, dim: true)
            .frame(maxHeight: 260)
        }
        .padding(.top, Tokens.Space.sm)
        .background(Tokens.ground)
    }

    private func modelLabel(_ draft: IntakeDraft) -> String {
        if case let .loaded(list)? = models?.state {
            return list.first { $0.id == draft.modelId }?.label ?? draft.modelId
        }
        return draft.modelId
    }

    private func add(_ draft: IntakeDraft) {
        // A new unit collides when either of its IMEIs matches either IMEI of a staged one.
        let codes = [draft.imei, draft.imei2].compactMap { $0 }
        let collides = drafts.contains { d in
            codes.contains(d.imei) || (d.imei2.map(codes.contains) ?? false)
        }
        guard !collides else {
            error = i18n.t("shipments.duplicateImei")
            Haptic.error.play()
            return
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
            Haptic.success.play()
            drafts = []
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("shipments.duplicateImei") : e.message
            Haptic.error.play()
        } catch let other {
            error = other.localizedDescription
            Haptic.error.play()
        }
    }
}

/// A staged unit as a Warm Card: model + mono IMEI + specs, cost and a remove
/// button on the right. The Kassa cart row shape.
private struct DraftCard: View {
    let label: String
    let cost: Decimal?
    let draft: IntakeDraft
    let onRemove: () -> Void

    var body: some View {
        AppCard {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    Text(label).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Text(draft.imei).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    if !draft.specsSummary.isEmpty {
                        Text(draft.specsSummary).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                Spacer(minLength: Tokens.Space.md)
                VStack(alignment: .trailing, spacing: Tokens.Space.sm) {
                    if let cost {
                        MoneyText(value: NSDecimalNumber(decimal: cost).stringValue, size: 15)
                    }
                    Button(role: .destructive, action: onRemove) {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(Tokens.muted)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
