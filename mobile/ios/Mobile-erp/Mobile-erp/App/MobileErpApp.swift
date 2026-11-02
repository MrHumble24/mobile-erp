import SwiftUI

/// App entry. Builds the dependency container once and injects it through the
/// environment; the Caldera tint (ink-black, adaptive in Dark Mode) is applied
/// at the root so stock controls pick it up.
@main
struct MobileErpApp: App {
    @State private var container = AppContainer()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
                .environment(container.i18n)
                .tint(Tokens.ink)
        }
    }
}
