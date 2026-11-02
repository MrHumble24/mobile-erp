import SwiftUI

/// Email + password sign-in. Submits to `Session.login`; the root view swaps to
/// the shell once the session is set. Shows an offline banner (login needs the
/// network) and a hidden door to the developer settings.
struct LoginView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var email = ""
    @State private var password = ""
    @State private var showDevConsole = false
    @FocusState private var focus: Field?

    private enum Field { case email, password }

    private var session: Session { container.session }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 8) {
                            Image(systemName: "iphone.gen3")
                                .font(.title3.weight(.bold))
                                .foregroundStyle(Tokens.ink)
                            Text("MALIKA ERP")
                                .font(.headline.weight(.bold))
                                .foregroundStyle(Tokens.ink)
                        }
                        Text(i18n.t("auth.loginTitle", default: "Terminal Sign In"))
                            .font(.title2.weight(.bold))
                            .foregroundStyle(Tokens.ink)
                        Text(i18n.t("auth.loginSubtitle", default: "Enter your staff credentials to begin your sales shift."))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 8)
                    .listRowBackground(Color.clear)
                }

                if !container.connectivity.isOnline {
                    Section {
                        Label(i18n.t("auth.offlineSignIn",
                                     default: "You are offline. Sign-in needs a connection."),
                              systemImage: "wifi.slash")
                            .font(.footnote)
                            .foregroundStyle(Tokens.warning)
                    }
                }

                if container.devAccess.quickLoginEnabled {
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Label("Quick Fill (Dev)", systemImage: "sparkles")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Button {
                                    showDevConsole = true
                                } label: {
                                    Text("Dev Panel")
                                        .font(.caption2)
                                }
                            }

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(DevAccounts.all) { acc in
                                        Button {
                                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                            email = acc.email
                                            password = acc.password
                                        } label: {
                                            HStack(spacing: 5) {
                                                Image(systemName: acc.icon)
                                                    .font(.system(size: 10, weight: .bold))
                                                Text(acc.label)
                                                    .font(.caption.weight(.semibold))
                                            }
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(acc.badgeColor.opacity(0.12), in: Capsule())
                                            .overlay(Capsule().strokeBorder(acc.badgeColor.opacity(0.3), lineWidth: 1))
                                            .foregroundStyle(acc.badgeColor)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                        .padding(.vertical, 2)
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                    }
                }

                Section {
                    TextField(i18n.t("auth.emailPlaceholder"), text: $email)
                        .textContentType(.username)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focus, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focus = .password }
                    SecureField(i18n.t("auth.passwordLabel"), text: $password)
                        .textContentType(.password)
                        .focused($focus, equals: .password)
                        .submitLabel(.go)
                        .onSubmit(submit)
                }

                if let error = session.loginError {
                    Section {
                        Text(message(for: error))
                            .font(.footnote)
                            .foregroundStyle(Tokens.destructive)
                    }
                }

                Section {
                    Button(action: submit) {
                        HStack(spacing: 8) {
                            if session.isLoggingIn {
                                ProgressView()
                                    .tint(Color(.systemBackground))
                            }
                            Text(i18n.t("auth.loginButton"))
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.ink)
                    .disabled(session.isLoggingIn || email.isEmpty || password.isEmpty)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }

                Section {
                    Button(i18n.t("auth.devPanel", default: "Developer settings")) {
                        showDevConsole = true
                    }
                    .font(.footnote)
                }
            }
            .sheet(isPresented: $showDevConsole) {
                DevConsoleGate()
            }
        }
    }

    private func submit() {
        guard !email.isEmpty, !password.isEmpty, !session.isLoggingIn else { return }
        Task { await session.login(email: email.trimmingCharacters(in: .whitespaces), password: password) }
    }

    private func message(for error: AppError) -> String {
        if error.isUnauthorized { return i18n.t("auth.invalidCredentials") }
        if error.isNetwork { return i18n.t("common.error") }
        return error.message
    }
}
