import SwiftUI

/// Create or edit a supplier. Online-only write; dismisses on success.
struct SupplierFormSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    let existing: Supplier?

    @State private var name = ""
    @State private var country = ""
    @State private var contact = ""
    @State private var notes = ""
    @State private var isActive = true
    @State private var busy = false
    @State private var error: String?

    private var editing: Bool { existing != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledField(i18n.t("shipments.supplierName"), text: $name)
                    LabeledField(i18n.t("shipments.supplierCountry"), text: $country)
                    LabeledField(i18n.t("shipments.supplierContact"), text: $contact, keyboard: .phonePad)
                    LabeledField(i18n.t("common.notes"), text: $notes)
                    if editing {
                        Toggle(i18n.t("shipments.supplierActive"), isOn: $isActive)
                    }
                }
                if let error {
                    Section { Text(error).foregroundStyle(Tokens.danger).font(.footnote) }
                }
            }
            .navigationTitle(i18n.t(editing ? "shipments.editSupplier" : "shipments.newSupplier"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) { Task { await submit() } }
                        .disabled(busy || name.trimmed.isEmpty)
                }
            }
            .onAppear(perform: hydrate)
        }
    }

    private func hydrate() {
        guard let s = existing else { return }
        name = s.name
        country = s.country ?? ""
        contact = s.contact ?? ""
        notes = s.notes ?? ""
        isActive = s.isActive
    }

    private func submit() async {
        guard !name.trimmed.isEmpty else { return }
        if let message = offlineBlock(container, i18n) { error = message; return }
        busy = true
        defer { busy = false }
        error = nil
        let body = SupplierWriteDTO(
            name: name.trimmed,
            country: country.trimmedOrNil,
            contact: contact.trimmedOrNil,
            notes: notes.trimmedOrNil,
            isActive: editing ? isActive : nil
        )
        let repo = SuppliersRepository(api: container.api)
        do {
            if let existing {
                _ = try await repo.update(existing.id, body)
            } else {
                _ = try await repo.create(body)
            }
            container.toasts.success(i18n.t("common.success"))
            dismiss()
        } catch let e as AppError {
            error = e.statusCode == 409 ? i18n.t("shipments.supplierDuplicate") : e.message
        } catch let other {
            error = other.localizedDescription
        }
    }
}
