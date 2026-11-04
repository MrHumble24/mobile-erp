import SwiftUI

/// iPhone overflow tab. Replaces UIKit's "More" controller: hosting SwiftUI
/// screens inside it (with no own NavigationStack) kept rebuilding them, which
/// reset their `@State` models and looped `.task` loads. Here every overflow
/// screen gets a real NavigationStack, and the list is one Warm Card of
/// icon + label + chevron rows on the ground. The pushed screen is driven by
/// `router.selection`, so `router.open(...)` into an overflow feature lands.
struct MoreTab: View {
    static let id = "more"
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    let modules: [FeatureModule]

    private var path: Binding<[String]> {
        Binding(
            get: {
                let sel = container.router.selection
                return modules.contains { $0.id == sel } ? [sel] : []
            },
            set: { container.router.selection = $0.last ?? Self.id }
        )
    }

    var body: some View {
        NavigationStack(path: path) {
            ScrollView {
                AppCard(padding: 0) {
                    VStack(spacing: 0) {
                        ForEach(Array(modules.enumerated()), id: \.element.id) { i, module in
                            NavigationLink(value: module.id) { row(module) }
                                .buttonStyle(.plain)
                            if i < modules.count - 1 {
                                Divider().overlay(Tokens.border).padding(.leading, Tokens.Space.lg)
                            }
                        }
                    }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            }
            .background(Tokens.ground)
            .navigationTitle(i18n.t("nav.more"))
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: String.self) { id in
                if let module = modules.first(where: { $0.id == id }) {
                    PermissionGate(permission: module.permission, content: module.root)
                        .navigationTitle(i18n.t(module.labelKey))
                        .navigationBarTitleDisplayMode(.inline)
                }
            }
        }
        // Toolbar icons on More-pushed screens read as `text`, not the orange app
        // tint (same shared cause as the primary tabs). PillButton primaries and
        // the active tab keep their explicit orange.
        .tint(Tokens.text)
    }

    private func row(_ module: FeatureModule) -> some View {
        HStack(spacing: Tokens.Space.md) {
            Image(systemName: module.systemImage)
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(Tokens.text)
                .frame(width: 24)
            Text(i18n.t(module.labelKey)).font(.ui(.body)).foregroundStyle(Tokens.text).lineLimit(1)
            Spacer(minLength: Tokens.Space.sm)
            Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(Tokens.muted)
        }
        .frame(minHeight: 52)
        .padding(.horizontal, Tokens.Space.lg)
        .padding(.vertical, Tokens.Space.sm)
        .contentShape(Rectangle())
    }
}
