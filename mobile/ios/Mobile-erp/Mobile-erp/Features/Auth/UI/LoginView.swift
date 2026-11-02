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
                    VStack(alignment: .leading, spacing: 4) {
                        Text(i18n.t("auth.loginTitle"))
                            .font(.largeTitle.weight(.bold))
                            .foregroundStyle(Tokens.ink)
                        Text(i18n.t("auth.loginSubtitle"))
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
                        if session.isLoggingIn {
                            ProgressView()
                        } else {
                            Text(i18n.t("auth.loginButton"))
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
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
