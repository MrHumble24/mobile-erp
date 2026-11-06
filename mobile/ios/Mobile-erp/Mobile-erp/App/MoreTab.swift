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
    @State private var showSwitchSheet = false

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
                let stores = container.session.user?.stores ?? []
                let activeStore = stores.first { $0.id == container.storeManager.activeStoreID }
                let canSwitch = stores.count > 1

                AppCard(padding: 0) {
                    HStack(spacing: Tokens.Space.md) {
                        Image(systemName: "storefront")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(Tokens.action)
                            .frame(width: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("stores.activeStore"))
                                .font(.ui(.caption))
                                .foregroundStyle(Tokens.muted)
                            Text(activeStore?.name ?? "...")
                                .font(.ui(.bodyStrong))
                                .foregroundStyle(Tokens.text)
                                .lineLimit(1)
                        }
                        Spacer(minLength: Tokens.Space.sm)
                        if canSwitch {
                            Button {
                                showSwitchSheet = true
                            } label: {
                                HStack(spacing: Tokens.Space.xs) {
                                    Text(i18n.t("stores.switchStore"))
                                        .font(.ui(.caption))
                                        .foregroundStyle(Tokens.action)
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(Tokens.action)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .frame(minHeight: 56)
                    .padding(.horizontal, Tokens.Space.lg)
                    .padding(.vertical, Tokens.Space.md)
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.top, Tokens.Space.md)

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
                        .navigationTitle(module.label(i18n))
                        .navigationBarTitleDisplayMode(.inline)
                }
            }
            .sheet(isPresented: $showSwitchSheet) {
                let stores = container.session.user?.stores ?? []
                let activeID = container.storeManager.activeStoreID
                NavigationStack {
                    ScrollView {
                        AppCard(padding: 0) {
                            VStack(spacing: 0) {
                                ForEach(Array(stores.enumerated()), id: \.element.id) { i, store in
                                    let isCurrent = store.id == activeID
                                    Button {
                                        showSwitchSheet = false
                                        if !isCurrent {
                                            Task { await container.switchStore(store.id) }
                                        }
                                    } label: {
                                        HStack(spacing: Tokens.Space.md) {
                                            Image(systemName: "storefront")
                                                .font(.system(size: 18, weight: .medium))
                                                .foregroundStyle(isCurrent ? Tokens.action : Tokens.text)
                                                .frame(width: 24)
                                            Text(store.name)
                                                .font(isCurrent ? .ui(.bodyStrong) : .ui(.body))
                                                .foregroundStyle(Tokens.text)
                                            Spacer(minLength: Tokens.Space.sm)
                                            if isCurrent {
                                                Image(systemName: "checkmark")
                                                    .font(.system(size: 14, weight: .bold))
                                                    .foregroundStyle(Tokens.success)
                                            }
                                        }
                                        .frame(minHeight: 52)
                                        .padding(.horizontal, Tokens.Space.lg)
                                        .padding(.vertical, Tokens.Space.sm)
                                        .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)
                                    if i < stores.count - 1 {
                                        Divider().overlay(Tokens.border).padding(.leading, Tokens.Space.lg)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, Tokens.Space.gutter)
                        .padding(.vertical, Tokens.Space.md)
                    }
                    .background(Tokens.ground)
                    .navigationTitle(i18n.t("stores.switchStore"))
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button(i18n.t("common.close")) { showSwitchSheet = false }
                        }
                    }
                }
                .presentationDetents([.medium, .large])
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
            Text(module.label(i18n)).font(.ui(.body)).foregroundStyle(Tokens.text).lineLimit(1)
            Spacer(minLength: Tokens.Space.sm)
            Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(Tokens.muted)
        }
        .frame(minHeight: 52)
        .padding(.horizontal, Tokens.Space.lg)
        .padding(.vertical, Tokens.Space.sm)
        .contentShape(Rectangle())
    }
}
