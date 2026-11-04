import SwiftUI

/// iPhone overflow tab. Replaces UIKit's "More" controller: hosting SwiftUI
/// screens inside it (with no own NavigationStack) kept rebuilding them, which
/// reset their `@State` models and looped `.task` loads (Hamkorlar/Nasiyalar
/// spun forever). Here every overflow screen gets a real NavigationStack.
/// The pushed screen is driven by `router.selection`, so `router.open(...)`
/// into an overflow feature still lands on it.
struct MoreTab: View {
    static let id = "more"

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    let modules: [FeatureModule]

    private var path: Binding<[String]> {
        Binding(
            get: {
                let sel = container.router.selection
                return modules.contains { $0.id == sel } ? [sel] : []
            },
            set: { container.router.selection = $0.last ?? Self.id }
        )
    }

    var body: some View {
        NavigationStack(path: path) {
            List(modules) { module in
                NavigationLink(value: module.id) {
                    Label(i18n.t(module.labelKey), systemImage: module.systemImage)
                }
            }
            .navigationTitle(i18n.t("nav.more", default: "More"))
            .navigationDestination(for: String.self) { id in
                if let module = modules.first(where: { $0.id == id }) {
                    PermissionGate(permission: module.permission, content: module.root)
                        .navigationTitle(i18n.t(module.labelKey))
                        .navigationBarTitleDisplayMode(.inline)
                }
            }
        }
        // Toolbar icons on More-pushed screens read as `text`, not the orange app
        // tint (same shared cause as the primary tabs). PillButton primaries and
        // the active tab keep their explicit orange.
        .tint(Tokens.text)
    }
}
