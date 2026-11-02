import SwiftUI

/// Top-level gate: splash while the persisted session is restored, then the
/// login screen or the authenticated shell. Kicks off the launch sync once.
struct RootView: View {
    @Environment(AppContainer.self) private var container

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
        .task { container.bootstrap() }
    }
}
