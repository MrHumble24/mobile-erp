import SwiftUI

/// Create a customer (`POST /customers`, online-only; blocked offline). Editing
/// is deferred — the foundation `APIClient` has no PATCH (see slice README).
struct CustomerFormSheet: View {
    let model: CustomersModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var phone = ""
    @State private var notes = ""
    @State private var busy = false
    @State private var error: String?

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
            .navigationTitle(i18n.t("sales.newCustomer"))
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
        Task {
            if let message = await model.create(name: name.trimmingCharacters(in: .whitespaces),
                                                phone: CustomersInput.orNil(phone),
                                                notes: CustomersInput.orNil(notes)) {
                busy = false
                error = message == "offline"
                    ? i18n.t("common.offline", default: "You are offline. This needs a connection.")
                    : message
            } else {
                busy = false
                dismiss()
            }
        }
    }
}
