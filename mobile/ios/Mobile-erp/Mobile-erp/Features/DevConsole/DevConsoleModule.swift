import SwiftUI

/// The developer console as a shell entry. Unlike feature modules it is not in
/// `FeatureRegistry`: the shell appends it based on `DevConsoleAccess.showsTab`
/// (DEBUG always, release after the access code), not a permission code.
enum DevConsoleModule {
    static let feature = FeatureModule(
        id: "dev-console",
        labelKey: "Developer",   // literal: i18n returns a dot-less key verbatim
        systemImage: "hammer",
        permission: nil,
        root: { AnyView(DevConsoleView()) }
    )
}
