import SwiftUI

/// Per-user detail sheet: status actions (activate / deactivate, reset
/// password) and a segmented switch over Profile / Roles / Overrides. All
/// writes are online-only; self-edits of roles, permissions and deactivation
/// are locked, as on the web.
struct UserDetailSheet: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let catalog: UsersCatalog
    var onChanged: () -> Void

    @State private var model: UserDetailModel
    @State private var section = DetailTab.profile
    @State private var resetOpen = false

    private enum DetailTab: Hashable { case profile, roles, overrides }

    init(userId: String, isSelf: Bool, catalog: UsersCatalog, onChanged: @escaping () -> Void) {
        self.catalog = catalog
        self.onChanged = onChanged
        _model = State(wrappedValue: UserDetailModel(userId: userId, isSelf: isSelf))
    }

    var body: some View {
        NavigationStack {
            Group {
                if model.loading {
                    LoadingView()
                } else if let user = model.user {
                    content(user)
                } else {
                    ErrorStateView(message: model.error ?? i18n.t("common.error")) {
                        Task { await model.load() }
                    }
                }
            }
            .navigationTitle(model.user?.displayName ?? i18n.t("users.detailTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
        }
        .task {
            model.bind(container)
            if model.user == nil { await model.load() }
        }
        .onChange(of: model.saved) { _, new in if new != nil { onChanged() } }
        .sheet(isPresented: $resetOpen) {
            ResetPasswordSheet(model: model)
        }
    }

    private func content(_ user: UserView) -> some View {
        Form {
            statusSection(user)
            Section {
                Picker("", selection: $section) {
                    Text(i18n.t("users.tabProfile")).tag(DetailTab.profile)
                    Text(i18n.t("users.roles")).tag(DetailTab.roles)
                    Text(i18n.t("users.tabOverrides")).tag(DetailTab.overrides)
                }
                .pickerStyle(.segmented)
            }
            switch section {
            case .profile: profileSection
            case .roles: UserRolesEditor(model: model, catalog: catalog)
            case .overrides: UserOverridesEditor(model: model, catalog: catalog)
            }
            feedback
        }
    }

    private func statusSection(_ user: UserView) -> some View {
        Section {
            LabeledContent(user.email) {
                StatusBadge(
                    user.isActive ? i18n.t("users.statusActive") : i18n.t("users.statusInactive"),
                    color: user.isActive ? Tokens.success : Tokens.ash)
            }
            Button(user.isActive ? i18n.t("users.deactivate") : i18n.t("users.reactivate"),
                   role: user.isActive ? .destructive : nil) {
                Task { await model.toggleActive(savedMessage: i18n.t(
                    user.isActive ? "users.deactivated" : "users.reactivated")) }
            }
            .disabled(model.isSelf && user.isActive)
            Button(i18n.t("users.resetPassword")) { resetOpen = true }
        }
    }

    private var profileSection: some View {
        Group {
            Section(i18n.t("users.tabProfile")) {
                labeled("users.firstName", $model.firstName)
                labeled("users.lastName", $model.lastName)
                labeled("common.phone", $model.phone, keyboard: .phonePad)
                labeled("users.telegramHandle", $model.telegramHandle)
                labeled("users.locale", $model.locale)
            }
            Section {
                Button(i18n.t("users.saveProfile")) {
                    Task { await model.saveProfile(savedMessage: i18n.t("users.profileSaved")) }
                }
                .buttonStyle(.borderedProminent)
                .foregroundStyle(Tokens.onInk)
            }
        }
    }

    private func labeled(_ key: String, _ binding: Binding<String>,
                         keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(i18n.t(key)).font(.caption).foregroundStyle(Tokens.muted)
            TextField(i18n.t(key), text: binding)
                .keyboardType(keyboard)
                .modifier(UserFieldSanitizer(keyboard: keyboard, text: binding))
        }
    }

    @ViewBuilder private var feedback: some View {
        if let saved = model.saved {
            Label(saved, systemImage: "checkmark.circle")
                .font(.footnote).foregroundStyle(Tokens.success)
        }
        if let error = model.error {
            Label(error, systemImage: "exclamationmark.triangle")
                .font(.footnote).foregroundStyle(Tokens.danger)
        }
    }
}

private struct UserFieldSanitizer: ViewModifier {
    let keyboard: UIKeyboardType
    @Binding var text: String

    func body(content: Content) -> some View {
        if keyboard == .phonePad {
            content.sanitizePhone($text)
        } else {
            content
        }
    }
}

/// Reset-password sub-sheet: new password + confirm, online-only.
private struct ResetPasswordSheet: View {
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    let model: UserDetailModel

    @State private var password = ""
    @State private var confirm = ""

    private var valid: Bool { password.count >= 8 && password == confirm }

    var body: some View {
        NavigationStack {
            Form {
                SecureField(i18n.t("users.newPassword"), text: $password)
                SecureField(i18n.t("users.confirmPassword"), text: $confirm)
                if !confirm.isEmpty && password != confirm {
                    Text(i18n.t("users.confirmPassword")).font(.caption).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("users.resetPassword"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("users.resetPassword")) {
                        Task {
                            await model.resetPassword(password, savedMessage: i18n.t("users.passwordReset"))
                            dismiss()
                        }
                    }
                    .disabled(!valid)
                }
            }
        }
    }
}
