import SwiftUI

/// Users & Access (RBAC) slice. Nav + route gated by `user.manage` (matching
/// the web nav). The Roles and Permission-matrix tabs call `/access/*`, which
/// needs `role.manage`; they are shown only when the user has it.
enum UsersModule {
    static let feature = FeatureModule(
        id: "users",
        labelKey: "nav.users",
        systemImage: "person.2.badge.gearshape",
        permission: "user.manage",
        root: { AnyView(UsersView()) }
    )
}
