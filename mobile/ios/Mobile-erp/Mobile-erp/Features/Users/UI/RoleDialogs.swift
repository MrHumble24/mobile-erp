import SwiftUI

/// Create-role form as a Warm Card sheet: code (uppercased, mono), name,
/// description. Online-only.
struct CreateRoleSheet: View {
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let catalog: UsersCatalog
    @State private var code = ""
    @State private var name = ""
    @State private var description = ""
    @State private var submitting = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("users.newRole")) { dismiss() }
                AppFormField(label: i18n.t("users.roleCode")) {
                    AppTextField(placeholder: "CASHIER", text: $code, autocapitalization: .characters,
                                 disableAutocorrection: true, font: .data(.regular))
                }
                AppFormField(label: i18n.t("users.roleName")) { AppTextField(placeholder: i18n.t("users.roleName"), text: $name) }
                AppFormField(label: i18n.t("users.description")) { AppTextField(placeholder: i18n.t("users.description"), text: $description) }
                if let err = catalog.actionError { FormErrorLine(message: err) }
                Button {
                    submitting = true
                    Task {
                        let ok = await catalog.createRole(code: code.trimmed.uppercased(), name: name.trimmed, description: description.trimmed)
                        submitting = false
                        if ok { dismiss() }
                    }
                } label: {
                    Text(i18n.t("common.create")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(code.trimmed.isEmpty || name.trimmed.isEmpty || submitting)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }
}

/// Rename / re-describe an existing role (code is immutable), and delete it
/// when it is not a system role. Online-only.
struct EditRoleSheet: View {
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let catalog: UsersCatalog
    let role: RoleView
    @State private var name: String
    @State private var description: String
    @State private var confirmDelete = false

    init(catalog: UsersCatalog, role: RoleView) {
        self.catalog = catalog
        self.role = role
        _name = State(initialValue: role.name)
        _description = State(initialValue: role.description ?? "")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("users.editRole")) { dismiss() }
                SubjectBlock(title: i18n.t("users.roleCode"), line: role.code)
                AppFormField(label: i18n.t("users.roleName")) { AppTextField(placeholder: i18n.t("users.roleName"), text: $name) }
                AppFormField(label: i18n.t("users.description")) { AppTextField(placeholder: i18n.t("users.description"), text: $description) }
                if let err = catalog.actionError { FormErrorLine(message: err) }
                Button {
                    Task {
                        let ok = await catalog.renameRole(role.code, name: name.trimmed, description: description.trimmed)
                        if ok { dismiss() }
                    }
                } label: {
                    Text(i18n.t("common.save")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(name.trimmed.isEmpty)
                if !role.isSystem {
                    Button { confirmDelete = true } label: { Text(i18n.t("common.delete")).frame(maxWidth: .infinity) }
                        .buttonStyle(.pillDestructive)
                } else {
                    FormErrorLine(message: i18n.t("users.systemRoleLocked"), color: Tokens.muted)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .confirmationDialog(i18n.t("users.confirmDeleteRole", ["role": role.name]), isPresented: $confirmDelete, titleVisibility: .visible) {
            Button(i18n.t("common.delete"), role: .destructive) {
                Task { if await catalog.deleteRole(role.code) { dismiss() } }
            }
            Button(i18n.t("common.cancel"), role: .cancel) {}
        }
    }
}
