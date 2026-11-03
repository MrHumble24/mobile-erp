import SwiftUI

/// Adaptive navigation chrome for every authenticated route. A `TabView` whose
/// tabs come from `FeatureRegistry`, filtered by the user's permissions. On
/// iOS 18+ the `.sidebarAdaptable` style turns the tab bar into a sidebar on
/// iPad (and a "More" overflow on iPhone); on iOS 17 the system handles tab
/// overflow with its own "More". Each tab is its own `NavigationStack` with a
/// permission-gated root and a shared account/offline toolbar.
struct AppShell: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    /// Tab selection is owned by the router so any feature can `open(...)` another.
    private var selection: Binding<String> {
        Binding(get: { container.router.selection },
                set: { container.router.selection = $0 })
    }

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
            }
    }

    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    private var overflowIndex: Int {
        visible.count > 5 ? 4 : 5
    }

    private var tabView: some View {
        TabView(selection: selection) {
            ForEach(Array(visible.enumerated()), id: \.element.id) { index, module in
                tabContent(for: module, at: index)
                    .tabItem { Label(i18n.t(module.labelKey), systemImage: module.systemImage) }
                    .tag(module.id)
            }
        }
    }

    @ViewBuilder
    private func tabContent(for module: FeatureModule, at index: Int) -> some View {
        // On iPhone, tabs beyond the 4th (or 5th when total <= 5) are hosted inside
        // the system "More" navigation controller. Wrapping them in an inner
        // NavigationStack produces a duplicate navigation bar that displaces the back
        // button and toolbar buttons onto separate rows.
        // Omitting the inner NavigationStack lets the More navigation bar host the
        // back button, title, and action buttons aligned in a single horizontal line.
        if !isPad && index >= overflowIndex {
            PermissionGate(permission: module.permission, content: module.root)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        Text(i18n.t(module.labelKey))
                            .font(.headline)
                    }
                    if !container.connectivity.isOnline {
                        ToolbarItem(placement: .topBarLeading) {
                            Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                                .labelStyle(.titleAndIcon)
                                .font(.caption)
                                .foregroundStyle(Tokens.warning)
                        }
                    }
                }
        } else {
            NavigationStack {
                PermissionGate(permission: module.permission, content: module.root)
                    .toolbar { toolbarContent }
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
