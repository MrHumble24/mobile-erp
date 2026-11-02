import SwiftUI

/// Environment section: pick an environment to inspect, see/edit its base URL
/// (Development is auto-detected), test the connection, switch the active
/// environment (confirms, then clears the session), and read app/build info.
struct DevEnvironmentView: View {
    @Environment(AppContainer.self) private var container

    @State private var viewed: AppEnv = .production
    @State private var editing = false
    @State private var confirmSwitch = false
    @State private var tester = DevTestConnection()

    private var config: DevConfig { container.devConfig }
    private var effectiveURL: String { config.url(for: viewed) }
    private var configured: Bool { config.isConfigured(viewed) }

    var body: some View {
        Form {
            envPicker
            urlSection
            if viewed == .development { hostSection }
            testSection
            if viewed != config.env { switchSection }
            appInfoSection
        }
        .onAppear { viewed = config.env }
        .sheet(isPresented: $editing) {
            DevEnvEditSheet(env: viewed, config: config)
        }
    }

    private var envPicker: some View {
        Section {
            Picker("Environment", selection: $viewed) {
                ForEach(AppEnv.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .onChange(of: viewed) { tester.reset() }
        } footer: {
            Text(viewed == config.env ? "Active environment." : "Previewing — not yet active.")
        }
    }

    @ViewBuilder private var urlSection: some View {
        Section("Base URL") {
            if configured {
                Text(effectiveURL).font(.mono(13)).textSelection(.enabled)
                LabeledContent("Source", value: config.isOverridden(viewed) ? "override" : "default")
            } else {
                Label("Not configured — enter a URL", systemImage: "exclamationmark.triangle")
                    .foregroundStyle(Tokens.warning)
            }
            Button { editing = true } label: { Label("Edit URL", systemImage: "pencil") }
            if config.isOverridden(viewed) {
                Button(role: .destructive) {
                    config.resetToDefault(for: viewed)
                } label: { Label("Reset to auto/default", systemImage: "arrow.uturn.backward") }
            }
        }
    }

    private var hostSection: some View {
        let host = DevHost.resolve()
        return Section("Detected host") {
            LabeledContent("Host", value: host.host).font(.mono(13))
            LabeledContent("Source", value: host.source)
        }
    }

    @ViewBuilder private var testSection: some View {
        Section("Connection") {
            Button {
                Task { await tester.run(baseURL: effectiveURL) }
            } label: {
                Label("Test connection", systemImage: "antenna.radiowaves.left.and.right")
            }
            .disabled(!configured || tester.outcome == .testing)
            testResult
        }
    }

    @ViewBuilder private var testResult: some View {
        switch tester.outcome {
        case .idle: EmptyView()
        case .testing: ProgressView()
        case let .reachable(ms, status):
            Label("Reachable · \(status) · \(ms) ms", systemImage: "checkmark.circle")
                .foregroundStyle(Tokens.success)
        case let .failed(message):
            Label(message, systemImage: "xmark.octagon").foregroundStyle(Tokens.danger)
        }
    }

    private var switchSection: some View {
        Section {
            Button {
                confirmSwitch = true
            } label: {
                Label("Switch to \(viewed.title)", systemImage: "arrow.left.arrow.right")
            }
            .disabled(!configured)
            .confirmationDialog(
                "Switch to \(viewed.title)? This signs you out (the token is per-environment).",
                isPresented: $confirmSwitch, titleVisibility: .visible
            ) {
                Button("Switch and sign out", role: .destructive) {
                    AppLog.info("devconsole", "env switch → \(viewed.rawValue)")
                    config.select(viewed)
                    container.session.logout()
                }
            }
        } footer: {
            Text("Switching clears the session and returns to the login screen.")
        }
    }

    private var appInfoSection: some View {
        Section("App") {
            LabeledContent("Active environment", value: config.env.title)
            LabeledContent("Version", value: Self.version)
            LabeledContent("Terminal ID", value: container.terminalID)
                .font(.mono(12))
        }
    }

    private static var version: String {
        let info = Bundle.main.infoDictionary
        let v = info?["CFBundleShortVersionString"] as? String ?? "—"
        let b = info?["CFBundleVersion"] as? String ?? "—"
        return "\(v) (\(b))"
    }
}
