import SwiftUI

/// App entry. Builds the dependency container once and injects it through the
/// environment; the Warm Card tint (`action` orange) is applied at the root so
/// stock controls pick it up, and `AppAppearance` themes the UIKit bars.
@main
struct MobileErpApp: App {
    @State private var container = AppContainer()

    init() { AppAppearance.apply() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(container)
                .environment(container.i18n)
                .tint(Tokens.action)
                .toggleStyle(AppSwitchStyle())
        }
    }
}
