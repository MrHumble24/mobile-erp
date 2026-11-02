import SwiftUI

/// Placeholder landing feature so the shell runs before wave-1 features exist.
/// The first real feature can keep this or replace it as the index route.
enum HomeModule {
    static let feature = FeatureModule(
        id: "home",
        labelKey: "nav.dashboard",
        systemImage: "house",
        permission: nil,
        root: { AnyView(HomeView()) }
    )
}

private struct HomeView: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        let i18n = container.i18n
        return ScrollView {
            VStack(spacing: 16) {
                AppCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Malika Bazaar")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(Tokens.ink)
                        Text(i18n.t("auth.loginSubtitle"))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        if let name = container.session.user?.displayName {
                            Divider().padding(.vertical, 4)
                            Label(name, systemImage: "person.circle")
                                .font(.callout)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                EmptyStateView(
                    systemImage: "square.grid.2x2",
                    title: i18n.t("common.loading", default: "Modules load here"),
                    message: i18n.t("nav.groupOperations", default: "Features arrive in later waves.")
                )
            }
            .padding()
        }
        .navigationTitle(i18n.t("nav.dashboard"))
        .background(Color(.systemGroupedBackground))
    }
}
