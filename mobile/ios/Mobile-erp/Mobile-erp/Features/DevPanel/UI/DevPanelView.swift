import SwiftUI

/// Hidden developer settings, reached from the login screen. Behind a
/// client-side access code it switches the backend environment and edits each
/// environment's API base URL. Saving persists and applies at runtime (the API
/// client reads the base URL per request) — no relaunch.
///
/// The code is a convenience gate to keep the panel out of casual reach, not a
/// security boundary; anything sensitive stays server-side.
struct DevPanelView: View {
    @Environment(AppContainer.self) private var container
    @Environment(\.dismiss) private var dismiss

    private static let accessCode = "153535"

    @State private var code = ""
    @State private var unlocked = false
    @State private var codeError = false
    @State private var env: AppEnv = .production
    @State private var prodURL = ""
    @State private var devURL = ""
    @State private var saved = false

    var body: some View {
        NavigationStack {
            Form {
                if unlocked { settings } else { gate }
            }
            .navigationTitle("Developer settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .onAppear(perform: load)
        }
    }

    @ViewBuilder private var gate: some View {
        Section("Access code") {
            SecureField("Enter code", text: $code)
                .keyboardType(.numberPad)
                .onSubmit(unlock)
            if codeError {
                Text("Wrong code").font(.footnote).foregroundStyle(Tokens.destructive)
            }
        }
        Section {
            Button("Unlock", action: unlock).disabled(code.isEmpty)
        }
    }

    @ViewBuilder private var settings: some View {
        Section("Environment") {
            Picker("Environment", selection: $env) {
                Text("Production").tag(AppEnv.production)
                Text("Development").tag(AppEnv.development)
            }
            .pickerStyle(.segmented)
        }
        Section("Production API URL") {
            TextField("https://…", text: $prodURL)
                .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
        }
        Section("Development API URL") {
            TextField("http://192.168.…:3000", text: $devURL)
                .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
        }
        Section {
            Button("Save", action: save).buttonStyle(.borderedProminent)
            if saved {
                Label("Saved — applied immediately", systemImage: "checkmark.circle")
                    .font(.footnote).foregroundStyle(Tokens.success)
            }
        }
    }

    private func load() {
        env = container.devConfig.env
        prodURL = container.devConfig.prodURL
        devURL = container.devConfig.devURL
    }

    private func unlock() {
        unlocked = code == Self.accessCode
        codeError = !unlocked
    }

    private func save() {
        container.devConfig.save(env: env, prodURL: prodURL, devURL: devURL)
        saved = true
    }
}
