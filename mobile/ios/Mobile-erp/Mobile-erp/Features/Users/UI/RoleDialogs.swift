import SwiftUI

/// Create-role form: code (uppercased, mono), name, description. Online-only.
struct CreateRoleSheet: View {
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let catalog: UsersCatalog

    @State private var code = ""
    @State private var name = ""
    @State private var description = ""
    @State private var submitting = false

    var body: some View {
        NavigationStack {
            Form {
                TextField(i18n.t("users.roleCode"), text: $code)
                    .font(.mono(15)).textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                TextField(i18n.t("users.roleName"), text: $name)
                TextField(i18n.t("users.description"), text: $description)
                if let err = catalog.actionError {
                    Label(err, systemImage: "exclamationmark.triangle")
                        .font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("users.newRole"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.create")) {
                        Task {
                            let ok = await catalog.createRole(
                                code: code.trimmed.uppercased(),
                                name: name.trimmed, description: description.trimmed)
                            if ok { dismiss() }
                        }
                    }
                    .disabled(code.trimmed.isEmpty || name.trimmed.isEmpty || submitting)
                }
            }
        }
    }
}

/// Rename / re-describe an existing role (code is immutable). Online-only.
struct EditRoleSheet: View {
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let catalog: UsersCatalog
    let role: RoleView

    @State private var name: String
    @State private var description: String

    init(catalog: UsersCatalog, role: RoleView) {
        self.catalog = catalog
        self.role = role
        _name = State(initialValue: role.name)
        _description = State(initialValue: role.description ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                LabeledContent(i18n.t("users.roleCode"), value: role.code)
                TextField(i18n.t("users.roleName"), text: $name)
                TextField(i18n.t("users.description"), text: $description)
                if let err = catalog.actionError {
                    Label(err, systemImage: "exclamationmark.triangle")
                        .font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("users.editRole"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) {
                        Task {
                            let ok = await catalog.renameRole(
                                role.code, name: name.trimmed, description: description.trimmed)
                            if ok { dismiss() }
                        }
                    }
                    .disabled(name.trimmed.isEmpty)
                }
            }
        }
    }
}
