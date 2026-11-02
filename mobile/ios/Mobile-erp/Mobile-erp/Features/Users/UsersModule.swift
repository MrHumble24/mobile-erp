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

/// Root: a segmented switch over Users / Roles / Permission matrix. Roles and
/// matrix appear only for `role.manage`. Shares one `UsersCatalog` (roles +
/// permissions) across the tabs so reference data loads once.
struct UsersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var catalog = UsersCatalog()
    @State private var tab = Tab.users

    private enum Tab: Hashable { case users, roles, matrix }

    var body: some View {
        VStack(spacing: 0) {
            if catalog.canManageRoles {
                Picker("", selection: $tab) {
                    Text(i18n.t("users.tabUsers")).tag(Tab.users)
                    Text(i18n.t("users.tabRoles")).tag(Tab.roles)
                    Text(i18n.t("users.tabPermissions")).tag(Tab.matrix)
                }
                .pickerStyle(.segmented)
                .padding([.horizontal, .top])
            }
            content
        }
        .navigationTitle(i18n.t("users.title"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            catalog.bind(container)
            await catalog.loadIfNeeded()
        }
    }

    @ViewBuilder private var content: some View {
        switch tab {
        case .users: UsersListView(catalog: catalog)
        case .roles: RolesListView(catalog: catalog)
        case .matrix: PermissionMatrixView(catalog: catalog)
        }
    }
}
