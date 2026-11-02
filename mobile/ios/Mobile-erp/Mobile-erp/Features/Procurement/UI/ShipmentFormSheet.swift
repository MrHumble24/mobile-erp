import SwiftUI

/// Create or edit a shipment. On success calls `onSaved` (so the caller can
/// chain into intake) then dismisses. Online-only write.
struct ShipmentFormSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let existing: Shipment?
    var onSaved: (Shipment) -> Void = { _ in }

    @State private var suppliers: [Supplier] = []
    @State private var supplierId: String?
    @State private var date = Date()
    @State private var expected = ""
    @State private var overhead = ""
    @State private var notes = ""
    @State private var busy = false
    @State private var error: String?

    private var editing: Bool { existing != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if !editing {
                        Picker(i18n.t("shipments.supplier"), selection: $supplierId) {
                            Text("—").tag(String?.none)
                            ForEach(suppliers.filter(\.isActive)) { s in
                                Text(s.name).tag(String?.some(s.id))
                            }
                        }
                    }
                    DatePicker(i18n.t("shipments.shipmentDate"), selection: $date, displayedComponents: .date)
                    LabeledField(i18n.t("shipments.expectedCount"), text: $expected, keyboard: .numberPad)
                    LabeledField(i18n.t("shipments.overheadCost"), text: $overhead, keyboard: .decimalPad)
                    LabeledField(i18n.t("common.notes"), text: $notes)
                }
                if let error {
                    Section { Text(error).foregroundStyle(Tokens.danger).font(.footnote) }
                }
            }
            .navigationTitle(i18n.t(editing ? "shipments.editShipment" : "shipments.createShipment"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) { Task { await submit() } }.disabled(busy)
                }
            }
            .task { await loadSuppliers() }
            .onAppear(perform: hydrate)
        }
    }

    private func hydrate() {
        guard let s = existing else { return }
        supplierId = s.supplierId
        expected = "\(s.expectedCount)"
        overhead = s.overheadCost ?? ""
        notes = s.notes ?? ""
        if let parsed = ISO8601DateFormatter().date(from: s.shipmentDate) { date = parsed }
    }

    private func loadSuppliers() async {
        guard !editing, suppliers.isEmpty else { return }
        suppliers = (try? await SuppliersRepository(api: container.api).list()) ?? []
    }

    private func submit() async {
        guard let count = Int(expected.trimmed), count >= 0 else {
            error = i18n.t("common.required"); return
        }
        if !editing && supplierId == nil { error = i18n.t("shipments.selectSupplier"); return }
        if let message = offlineBlock(container, i18n) { error = message; return }
        busy = true
        defer { busy = false }
        error = nil
        let body = ShipmentWriteDTO(
            supplierId: editing ? nil : supplierId,
            shipmentDate: ISO8601DateFormatter().string(from: date),
            expectedCount: count,
            overheadCost: overhead.asDecimal,
            notes: notes.trimmedOrNil
        )
        let repo = ShipmentsRepository(api: container.api)
        do {
            let saved = try await (editing ? repo.update(existing!.id, body) : repo.create(body))
            onSaved(saved)
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch let other {
            error = other.localizedDescription
        }
    }
}
