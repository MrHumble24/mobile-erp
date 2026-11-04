import SwiftUI

/// Root: the kit segmented switch over Users / Roles / Permission matrix
/// (Roles and matrix only for `role.manage`). Shares one `UsersCatalog`
/// (roles + permissions) across the tabs so reference data loads once. Title
/// is the tab label (`nav.users`), the same string as the Android top bar.
struct UsersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var catalog = UsersCatalog()
    @State private var tab = Tab.users

    enum Tab: String, Hashable { case users, roles, matrix }

    var body: some View {
        VStack(spacing: 0) {
            if catalog.canManageRoles {
                TabChips(selection: $tab, items: [
                    TabChipItem(value: .users, label: i18n.t("users.tabUsers")),
                    TabChipItem(value: .roles, label: i18n.t("users.tabRoles")),
                    TabChipItem(value: .matrix, label: i18n.t("users.tabPermissions")),
                ])
                .padding(.vertical, Tokens.Space.md)
            }
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("nav.users"))
        .task {
            catalog.bind(container)
            await catalog.loadIfNeeded()
            #if DEBUG
            // Screenshot helper: `-openTab users|roles|matrix`.
            if let raw = KitDebugLaunch.consume("openTab", accept: { Tab(rawValue: $0) != nil }), let t = Tab(rawValue: raw) { tab = t }
            #endif
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
