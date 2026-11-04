import SwiftUI

/// Create or edit a customer as a Warm Card sheet (`POST` / `PATCH
/// /customers/:id`, online-only; blocked offline). Pass `editing` to edit.
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(editing == nil ? "customers.newTitle" : "customers.editTitle")) { dismiss() }
                if !model.isOnline { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                AppFormField(label: i18n.t("customers.name")) {
                    AppTextField(placeholder: i18n.t("customers.name"), text: $name, autocapitalization: .words)
                }
                AppFormField(label: i18n.t("customers.phone")) {
                    AppTextField(placeholder: i18n.t("customers.phone"), text: $phone, keyboard: .phonePad,
                                 autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                        .sanitizePhone($phone)
                }
                AppFormField(label: i18n.t("customers.notes")) {
                    AppTextField(placeholder: i18n.t("customers.notesPlaceholder"), text: $notes)
                }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("common.save")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(busy || CustomersInput.orNil(name) == nil || !model.isOnline)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    private func submit() {
        guard CustomersInput.orNil(name) != nil, !busy else { return }
        guard model.isOnline else { error = i18n.t("common.offline"); return }
        busy = true
        error = nil
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let phoneValue = CustomersInput.orNil(phone)
        let notesValue = CustomersInput.orNil(notes)
        Task {
            let message: String?
            if let editing {
                message = await model.update(id: editing.id, name: trimmedName, phone: phoneValue, notes: notesValue)
            } else {
                message = await model.create(name: trimmedName, phone: phoneValue, notes: notesValue)
            }
            busy = false
            if let message {
                error = message == "offline" ? i18n.t("common.offline") : message
            } else {
                dismiss()
            }
        }
    }
}
