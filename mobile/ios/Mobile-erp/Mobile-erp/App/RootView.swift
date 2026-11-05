import SwiftUI

/// Top-level gate: splash while the persisted session is restored, then the
/// login screen or the authenticated shell. Kicks off the launch sync once.
struct RootView: View {
    @Environment(AppContainer.self) private var container
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if container.session.isRestoring {
                LoadingView()
            } else if container.session.isAuthenticated {
                AppShell()
            } else {
                LoginView()
            }
        }
        .animation(.default, value: container.session.isAuthenticated)
        .kitToastOverlay()
        .task {
            #if DEBUG
            await container.devAutoSignIn()
            #endif
            container.bootstrap()
            await refreshPermissions()
        }
        // A permission granted/revoked server-side applies on the next foreground,
        // no sign-out needed (phone apps previously read permissions at sign-in only).
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { Task { await refreshPermissions() } }
        }
    }

    private func refreshPermissions() async {
        guard container.connectivity.isOnline, container.session.isAuthenticated else { return }
        await container.session.refreshUser()
    }
}
