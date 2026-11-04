import SwiftUI

/// Per-user detail as a Warm Card sheet: name + mono email + status pill, the
/// status actions (deactivate = destructive / reactivate = secondary, reset
/// password = ghost), then the kit segmented switch over Profile / Roles /
/// Overrides. All writes online-only; self-edits of roles, permissions and
/// deactivation are locked, as on the web.
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: model.user?.displayName ?? i18n.t("users.detailTitle")) { dismiss() }
                if model.loading {
                    LoadingView().frame(height: 160)
                } else if let user = model.user {
                    content(user)
                } else {
                    ErrorStateView(message: model.error ?? i18n.t("common.error")) { Task { await model.load() } }
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            model.bind(container)
            if model.user == nil { await model.load() }
        }
        .onChange(of: model.saved) { _, new in if new != nil { onChanged() } }
        .sheet(isPresented: $resetOpen) { ResetPasswordSheet(model: model) }
    }

    @ViewBuilder private func content(_ user: UserView) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(user.email).font(.data(.regular)).foregroundStyle(Tokens.text)
            StatusBadge(i18n.t(user.isActive ? "users.statusActive" : "users.statusInactive"),
                        color: user.isActive ? Tokens.success : Tokens.danger)
        }
        HStack(spacing: Tokens.Space.sm) {
            Button {
                Task { await model.toggleActive(savedMessage: i18n.t(user.isActive ? "users.deactivated" : "users.reactivated")) }
            } label: {
                Text(i18n.t(user.isActive ? "users.deactivate" : "users.reactivate")).frame(maxWidth: .infinity)
            }
            .buttonStyle(user.isActive ? .pillDestructive : .pillSecondary)
            .disabled(model.isSelf && user.isActive)
            Button { resetOpen = true } label: { Text(i18n.t("users.resetPassword")).frame(maxWidth: .infinity) }
                .buttonStyle(.pillGhost)
        }
        SegmentedControl(selection: $section, segments: [
            (.profile, i18n.t("users.tabProfile")),
            (.roles, i18n.t("users.tabRoles")),
            (.overrides, i18n.t("users.tabOverrides")),
        ])
        switch section {
        case .profile: profileSection
        case .roles: UserRolesEditor(model: model, catalog: catalog)
        case .overrides: UserOverridesEditor(model: model, catalog: catalog)
        }
        feedback
    }

    @ViewBuilder private var profileSection: some View {
        field("users.firstName", $model.firstName)
        field("users.lastName", $model.lastName)
        AppFormField(label: i18n.t("common.phone")) {
            AppTextField(placeholder: i18n.t("common.phone"), text: $model.phone, keyboard: .phonePad,
                         autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                .sanitizePhone($model.phone)
        }
        field("users.telegramHandle", $model.telegramHandle)
        field("users.locale", $model.locale)
        Button { Task { await model.saveProfile(savedMessage: i18n.t("users.profileSaved")) } } label: {
            Text(i18n.t("users.saveProfile")).frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillPrimary)
        .disabled(model.firstName.trimmed.isEmpty)
    }

    private func field(_ key: String, _ binding: Binding<String>) -> some View {
        AppFormField(label: i18n.t(key)) { AppTextField(placeholder: i18n.t(key), text: binding) }
    }

    @ViewBuilder private var feedback: some View {
        if let saved = model.saved { FormErrorLine(message: saved, color: Tokens.success) }
        if let error = model.error { FormErrorLine(message: error) }
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("users.resetPassword")) { dismiss() }
                if let email = model.user?.email {
                    SubjectBlock(title: model.user?.displayName ?? email, line: email)
                }
                AppFormField(label: i18n.t("users.newPassword")) { AppSecureField(placeholder: i18n.t("users.newPassword"), text: $password) }
                AppFormField(label: i18n.t("users.confirmPassword")) { AppSecureField(placeholder: i18n.t("users.confirmPassword"), text: $confirm) }
                if !confirm.isEmpty && password != confirm { FormErrorLine(message: i18n.t("users.confirmPassword")) }
                Button {
                    Task { await model.resetPassword(password, savedMessage: i18n.t("users.passwordReset")); dismiss() }
                } label: {
                    Text(i18n.t("users.resetPassword")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(!valid)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }
}
