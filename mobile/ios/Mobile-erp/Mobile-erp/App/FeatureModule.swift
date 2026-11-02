import SwiftUI

/// A feature module — the unit the shell composes into a tab / sidebar entry.
/// Each feature slice defines exactly one `static let feature: FeatureModule`
/// in its own file and registers it with a single line in `FeatureRegistry`.
///
/// The `root` view reads whatever it needs (`AppContainer`) from the SwiftUI
/// `Environment`, so modules carry no dependencies and never import each other.
struct FeatureModule: Identifiable {
    /// Stable identity, also the navigation value, e.g. `"inventory"`.
    let id: String
    /// i18n key for the tab/sidebar label, e.g. `"nav.inventory"`.
    let labelKey: String
    /// SF Symbol name.
    let systemImage: String
    /// Permission code required to see/enter the section; nil = always.
    let permission: String?
    /// Builds the feature's root screen.
    let root: () -> AnyView

    init(id: String, labelKey: String, systemImage: String,
         permission: String? = nil, root: @escaping () -> AnyView) {
        self.id = id
        self.labelKey = labelKey
        self.systemImage = systemImage
        self.permission = permission
        self.root = root
    }
}
