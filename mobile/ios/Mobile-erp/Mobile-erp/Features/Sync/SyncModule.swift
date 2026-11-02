import SwiftUI

/// Sync slice. Visible to every signed-in user (they can watch their own
/// offline queue); the conflict-resolution section inside is gated by
/// `sync.resolve`. `permission: nil` so the shell always shows the tab.
enum SyncModule {
    static let feature = FeatureModule(
        id: "sync",
        labelKey: "nav.sync",
        systemImage: "arrow.triangle.2.circlepath",
        permission: nil,
        root: { AnyView(SyncView()) }
    )
}
