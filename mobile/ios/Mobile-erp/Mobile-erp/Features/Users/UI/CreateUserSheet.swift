import SwiftUI

/// Create-user form (name, phone, email, password, roles). Online-only write;
/// blocks with a needs-connection message when offline. Mirrors the web
/// CreateUserDialog.
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

    private var valid: Bool {
        !firstName.trimmed.isEmpty && !email.trimmed.isEmpty && password.count >= 8
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(i18n.t("users.fullName"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField(i18n.t("users.fullName"), text: $firstName)
                    }
                    .padding(.vertical, 2)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(i18n.t("common.phone"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField(i18n.t("common.phone"), text: $phone)
                            .keyboardType(.phonePad)
                    }
                    .padding(.vertical, 2)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(i18n.t("users.email"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField(i18n.t("users.email"), text: $email)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(.mono(15))
                    }
                    .padding(.vertical, 2)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(i18n.t("users.password"))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        SecureField(i18n.t("users.password"), text: $password)
                    }
                    .padding(.vertical, 2)
                }
                Section(i18n.t("users.roles")) {
                    ForEach(catalog.roles) { role in
                        Toggle(role.name, isOn: Binding(
                            get: { roles.contains(role.code) },
                            set: { on in
                                if on { roles.insert(role.code) } else { roles.remove(role.code) }
                            }))
                    }
                }
                if let error {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("users.newUser"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.create")) { Task { await submit() } }
                        .disabled(!valid || submitting)
                }
            }
        }
    }

    private func submit() async {
        guard container.connectivity.isOnline else {
            error = i18n.t("common.needsConnection",
                           default: "No connection — try again when you are back online.")
            return
        }
        submitting = true
        error = nil
        defer { submitting = false }
        let repo = makeUsersRepository(container)
        let dto = CreateUserDto(
            email: email.trimmed,
            password: password,
            profile: CreateUserProfileDto(
                firstName: firstName.trimmed,
                lastName: nil,
                phone: phone.trimmed.isEmpty ? nil : phone.trimmed,
                telegramHandle: nil),
            roleCodes: Array(roles))
        do {
            _ = try await repo.create(dto)
            onCreated()
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = error.localizedDescription
        }
    }
}
