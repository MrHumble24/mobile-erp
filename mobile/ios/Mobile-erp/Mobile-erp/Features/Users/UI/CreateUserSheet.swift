import SwiftUI

/// Create-user form as a Warm Card sheet (name, phone, email, password, roles
/// as switch rows). Online-only write; blocks with a notice when offline.
struct CreateUserSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let catalog: UsersCatalog
    var onCreated: () -> Void

    @State private var firstName = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var password = ""
    @State private var roles: Set<String> = []
    @State private var submitting = false
    @State private var error: String?

    private var valid: Bool { !firstName.trimmed.isEmpty && !email.trimmed.isEmpty && password.count >= 8 }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("users.newUser")) { dismiss() }
                if !container.connectivity.isOnline { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                AppFormField(label: i18n.t("users.fullName")) {
                    AppTextField(placeholder: i18n.t("users.fullName"), text: $firstName, autocapitalization: .words)
                }
                AppFormField(label: i18n.t("common.phone")) {
                    AppTextField(placeholder: "+998", text: $phone, keyboard: .phonePad, autocapitalization: .never,
                                 disableAutocorrection: true, font: .data(.regular))
                        .sanitizePhone($phone)
                }
                AppFormField(label: i18n.t("users.email")) {
                    AppTextField(placeholder: i18n.t("users.email"), text: $email, keyboard: .emailAddress,
                                 autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                }
                AppFormField(label: i18n.t("users.password")) { AppSecureField(placeholder: i18n.t("users.password"), text: $password) }
                RoleSwitches(roles: catalog.roles, selected: $roles, disabled: false)
                if let error { FormErrorLine(message: error) }
                Button { Task { await submit() } } label: {
                    Text(i18n.t("common.create")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(!valid || submitting || !container.connectivity.isOnline)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
    }

    private func submit() async {
        guard container.connectivity.isOnline else { error = i18n.t("common.offline"); return }
        submitting = true
        error = nil
        defer { submitting = false }
        let repo = makeUsersRepository(container)
        let dto = CreateUserDto(
            email: email.trimmed, password: password,
            profile: CreateUserProfileDto(firstName: firstName.trimmed, lastName: nil,
                                          phone: phone.trimmed.isEmpty ? nil : phone.trimmed, telegramHandle: nil),
            roleCodes: Array(roles))
        do {
            _ = try await repo.create(dto)
            onCreated()
            dismiss()
        } catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}

/// Roles as labelled switch rows (name + mono code), shared by create and the
/// per-user roles editor.
struct RoleSwitches: View {
    @Environment(I18n.self) private var i18n
    let roles: [RoleView]
    @Binding var selected: Set<String>
    let disabled: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(i18n.t("users.roles")).font(.ui(.label)).foregroundStyle(Tokens.muted).padding(.bottom, Tokens.Space.sm)
            ForEach(Array(roles.enumerated()), id: \.element.id) { i, role in
                Toggle(isOn: Binding(get: { selected.contains(role.code) },
                                     set: { on in if on { selected.insert(role.code) } else { selected.remove(role.code) } })) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(role.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                        Text(role.code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                }
                .disabled(disabled)
                .frame(minHeight: Tokens.Space.minTouch)
                if i < roles.count - 1 { Divider().overlay(Tokens.border) }
            }
        }
    }
}

/// A `SecureField` in the kit field chrome.
struct AppSecureField: View {
    let placeholder: String
    @Binding var text: String
    @FocusState private var focused: Bool

    var body: some View {
        SecureField(placeholder, text: $text)
            .font(.ui(.body))
            .foregroundStyle(Tokens.text)
            .tint(Tokens.action)
            .focused($focused)
            .frame(height: Tokens.Space.controlH)
            .padding(.horizontal, Tokens.Space.lg)
            .background(RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous).fill(Tokens.card))
            .overlay(RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                .strokeBorder(focused ? Tokens.text : Tokens.border, lineWidth: focused ? 2 : 1))
    }
}
