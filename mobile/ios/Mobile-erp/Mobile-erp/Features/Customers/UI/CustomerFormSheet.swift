import SwiftUI

/// Create or edit a customer (`POST` / `PATCH /customers/:id`, online-only;
/// blocked offline). Pass `editing` to edit an existing customer.
struct CustomerFormSheet: View {
    let model: CustomersModel
    var editing: CustomerListItem?
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var phone: String
    @State private var notes: String
    @State private var busy = false
    @State private var error: String?

    init(model: CustomersModel, editing: CustomerListItem? = nil) {
        self.model = model
        self.editing = editing
        _name = State(initialValue: editing?.name ?? "")
        _phone = State(initialValue: editing?.phone ?? "")
        _notes = State(initialValue: editing?.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(i18n.t("sales.customerName"), text: $name)
                    TextField(i18n.t("sales.customerPhone"), text: $phone)
                        .keyboardType(.phonePad)
                    TextField(i18n.t("sales.customerNotes"), text: $notes, axis: .vertical)
                        .lineLimit(1...3)
                }
                if let error {
                    Section { Text(error).foregroundStyle(Tokens.destructive).font(.footnote) }
                }
            }
            .navigationTitle(editing == nil
                ? i18n.t("sales.newCustomer")
                : i18n.t("sales.editCustomer", default: "Edit customer"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if busy { ProgressView() }
                    else {
                        Button(i18n.t("common.save"), action: submit)
                            .disabled(CustomersInput.orNil(name) == nil)
                    }
                }
            }
        }
    }

    private func submit() {
        guard CustomersInput.orNil(name) != nil, !busy else { return }
        guard model.isOnline else {
            error = i18n.t("common.offline", default: "You are offline. This needs a connection.")
            return
        }
        busy = true
        error = nil
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let phoneValue = CustomersInput.orNil(phone)
        let notesValue = CustomersInput.orNil(notes)
        Task {
            let message: String?
            if let editing {
                message = await model.update(id: editing.id, name: trimmedName,
                                             phone: phoneValue, notes: notesValue)
            } else {
                message = await model.create(name: trimmedName, phone: phoneValue, notes: notesValue)
            }
            busy = false
            if let message {
                error = message == "offline"
                    ? i18n.t("common.offline", default: "You are offline. This needs a connection.")
                    : message
            } else {
                dismiss()
            }
        }
    }
}
