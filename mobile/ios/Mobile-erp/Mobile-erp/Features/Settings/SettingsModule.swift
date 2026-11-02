import SwiftUI

/// Store Settings slice. Nav entry + route root gated by `settings.manage`
/// (matching the web nav); `GET /settings` itself is open, but only managers
/// can reach and edit the form.
enum SettingsModule {
    static let feature = FeatureModule(
        id: "settings",
        labelKey: "nav.settings",
        systemImage: "gearshape",
        permission: "settings.manage",
        root: { AnyView(SettingsView()) }
    )
}
