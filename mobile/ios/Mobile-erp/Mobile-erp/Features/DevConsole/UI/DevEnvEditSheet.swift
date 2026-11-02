import SwiftUI

/// Edits one environment's base URL override. Saving applies live (the API
/// client reads the base URL per request); "Reset to auto/default" drops the
/// override so the environment reverts to its factory/auto URL.
struct DevEnvEditSheet: View {
    let env: AppEnv
    let config: DevConfig
    @Environment(\.dismiss) private var dismiss

    @State private var text = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("\(env.title) URL") {
                    TextField("https://… or http://host:3000", text: $text)
                        .font(.mono(13))
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
                Section {
                    Button("Reset to auto/default", role: .destructive) {
                        text = DevConfig.defaultURL(for: env)
                    }
                } footer: {
                    Text("Default: \(DevConfig.defaultURL(for: env).isEmpty ? "— (none yet)" : DevConfig.defaultURL(for: env))")
                }
            }
            .navigationTitle("Edit \(env.title)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        // Saving the default URL verbatim means "no override".
                        let isDefault = text.trimmingCharacters(in: .whitespaces) == DevConfig.defaultURL(for: env)
                        config.setOverride(isDefault ? nil : text, for: env)
                        AppLog.info("devconsole", "edit \(env.rawValue) URL")
                        dismiss()
                    }
                }
            }
            .onAppear { text = config.url(for: env) }
        }
    }
}
