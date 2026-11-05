import SwiftUI

/// Adaptive navigation chrome for every authenticated route. A `TabView` whose
/// tabs come from `FeatureRegistry`, filtered by the user's permissions. On
/// iOS 18+ the `.sidebarAdaptable` style turns the tab bar into a sidebar on
/// iPad. On iPhone, overflow goes to our own `MoreTab`, never UIKit's "More".
/// Each tab is its own `NavigationStack` with a permission-gated root and a
/// shared account/offline toolbar.
struct AppShell: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    private var visible: [FeatureModule] {
        var mods = FeatureRegistry.all.filter {
            $0.permission == nil || container.session.can($0.permission!)
        }
        if container.devAccess.showsTab { mods.append(DevConsoleModule.feature) }
        return mods
    }

    var body: some View {
        tabView
            .modifier(SidebarAdaptableStyle())
            .onAppear {
                if container.router.selection.isEmpty {
                    container.router.selection = visible.first?.id ?? ""
                }
                #if DEBUG
                // Screenshot helper: `-open home|pos|sales|inventory|shipments|qc|consignments|partners|customers|expenses|balance|reports|customs|users|settings|more`.
                if let open = UserDefaults.standard.string(forKey: "open"),
                   let id = ["home": "dashboard", "pos": "pos", "sales": "sales",
                             "inventory": "inventory", "stock": "stock", "shipments": "shipments", "qc": "qc",
                             "consignments": "consignments", "partners": "partners", "customers": "customers", "expenses": "expenses", "balance": "balance", "users": "users", "reports": "reports", "customs": "customs", "settings": "settings",
                             "more": MoreTab.id][open] {
                    container.router.selection = id
                }
                #endif
            }
    }

    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    /// iPhone shows 4 tabs + our own `MoreTab` once modules exceed 5 (never
    /// UIKit's "More" — see MoreTab). iPad's sidebar lists everything.
    private var split: (tabs: [FeatureModule], more: [FeatureModule]) {
        guard !isPad, visible.count > 5 else { return (visible, []) }
        return (Array(visible.prefix(4)), Array(visible.dropFirst(4)))
    }

    /// Overflow feature ids select the More tab; MoreTab pushes the feature.
    private func tabSelection(_ more: [FeatureModule]) -> Binding<String> {
        Binding(
            get: {
                let sel = container.router.selection
                return more.contains { $0.id == sel } ? MoreTab.id : sel
            },
            set: { container.router.selection = $0 }
        )
    }

    private var tabView: some View {
        let (tabs, more) = split
        return TabView(selection: tabSelection(more)) {
            ForEach(tabs) { module in
                NavigationStack {
                    PermissionGate(permission: module.permission, content: module.root)
                        .scrollContentBackground(.hidden)
                        .background(Tokens.ground)
                        // Toolbar icons (and stray stock controls) read as `text`,
                        // not the orange app tint. The one orange lives on
                        // PillButton primaries and the active tab, which set it
                        // explicitly and are unaffected by this.
                        .tint(Tokens.text)
                        .toolbarBackground(Tokens.ground, for: .navigationBar)
                        .toolbar { toolbarContent }
                }
                .tabItem { Label(i18n.t(module.labelKey), systemImage: module.systemImage) }
                .tag(module.id)
            }
            if !more.isEmpty {
                MoreTab(modules: more)
                    .tabItem { Label(i18n.t("nav.more", default: "More"), systemImage: "ellipsis") }
                    .tag(MoreTab.id)
            }
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        if !container.connectivity.isOnline {
            ToolbarItem(placement: .topBarLeading) {
                Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                    .labelStyle(.titleAndIcon)
                    .font(.caption)
                    .foregroundStyle(Tokens.warning)
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                if let name = container.session.user?.displayName {
                    Text(name)
                }
                LocaleMenu(i18n: i18n)
                Divider()
                Button(role: .destructive) {
                    container.session.logout()
                } label: {
                    Label(i18n.t("auth.logout"), systemImage: "rectangle.portrait.and.arrow.right")
                }
            } label: {
                Image(systemName: "person.crop.circle")
                    .foregroundStyle(Tokens.text)
            }
        }
    }
}

/// Locale switcher (uz / en), persisted. Stock `Picker` inside the account menu.
struct LocaleMenu: View {
    let i18n: I18n
    var body: some View {
        Picker(i18n.t("settings.language", default: "Language"),
               selection: Binding(get: { i18n.locale },
                                  set: { i18n.setLocale($0) })) {
            Text("O'zbekcha").tag("uz")
            Text("English").tag("en")
        }
    }
}

/// Applies `.sidebarAdaptable` on iOS 18+, a plain tab bar below that.
private struct SidebarAdaptableStyle: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 18.0, *) {
            content.tabViewStyle(.sidebarAdaptable)
        } else {
            content
        }
    }
}
