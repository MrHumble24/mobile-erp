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
    /// English fallback when `labelKey`'s namespace is not bundled yet (e.g.
    /// repairs, whose i18n the web adds later). nil = the key always resolves.
    let labelFallback: String?
    /// SF Symbol name.
    let systemImage: String
    /// Permission code required to see/enter the section; nil = always.
    let permission: String?
    /// An optional runtime gate (beyond permission) — e.g. an optional feature
    /// hidden entirely while its store setting is off (repairs, ADR 0040). nil =
    /// always enabled.
    let isEnabled: ((AppContainer) -> Bool)?
    /// Builds the feature's root screen.
    let root: () -> AnyView

    init(id: String, labelKey: String, labelFallback: String? = nil, systemImage: String,
         permission: String? = nil, isEnabled: ((AppContainer) -> Bool)? = nil,
         root: @escaping () -> AnyView) {
        self.id = id
        self.labelKey = labelKey
        self.labelFallback = labelFallback
        self.systemImage = systemImage
        self.permission = permission
        self.isEnabled = isEnabled
        self.root = root
    }

    /// The resolved tab/sidebar label — the key, or its English fallback when the
    /// key's namespace is not bundled yet.
    func label(_ i18n: I18n) -> String { i18n.t(labelKey, default: labelFallback) }
}
