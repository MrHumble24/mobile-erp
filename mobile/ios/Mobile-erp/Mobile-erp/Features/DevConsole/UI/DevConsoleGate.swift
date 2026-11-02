import SwiftUI

/// Access-code gate for reaching the developer console from the login screen.
/// On the correct code it unlocks `DevConsoleAccess` (so the Developer tab also
/// appears after sign-in this session) and presents the console.
///
/// The code is a convenience gate to keep the console out of casual reach, not
/// a security boundary; anything sensitive stays server-side.
struct DevConsoleGate: View {
    @Environment(AppContainer.self) private var container
    @Environment(\.dismiss) private var dismiss

    @State private var code = ""
    @State private var showError = false

    var body: some View {
        NavigationStack {
            Group {
                if container.devAccess.unlocked {
                    DevConsoleView()
                } else {
                    gate
                }
            }
            .navigationTitle(container.devAccess.unlocked ? "Developer" : "Developer settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var gate: some View {
        Form {
            Section("Access code") {
                SecureField("Enter code", text: $code)
                    .keyboardType(.numberPad)
                    .onSubmit(unlock)
                if showError {
                    Text("Wrong code").font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            Section {
                Button("Unlock", action: unlock).disabled(code.isEmpty)
            }
        }
    }

    private func unlock() {
        showError = !container.devAccess.unlock(code)
    }
}
