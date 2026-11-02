import SwiftUI

/// Quick jumps to the busiest screens (POS, inventory, QC, sales, nasiya) via
/// `KitRouter` — the kit's cross-feature navigation. Each action shows only if
/// the user holds the destination's permission.
struct DashboardQuickActions: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    private struct Action: Identifiable {
        let route: KitRoute
        let labelKey: String
        let icon: String
        let permission: String
        var id: String { labelKey }
    }

    private let actions: [Action] = [
        Action(route: .pos(), labelKey: "nav.quickPos", icon: "creditcard", permission: "sale.create"),
        Action(route: .inventory(), labelKey: "nav.inventory", icon: "iphone", permission: "device.read"),
        Action(route: .qc(), labelKey: "nav.qc", icon: "checkmark.seal", permission: "qc.read"),
        Action(route: .sales(), labelKey: "nav.sales", icon: "chart.bar.doc.horizontal", permission: "sale.read"),
        Action(route: .consignments(), labelKey: "nav.consignments",
               icon: "arrow.left.arrow.right", permission: "consignment.read"),
    ]

    private var visible: [Action] { actions.filter { container.session.can($0.permission) } }

    var body: some View {
        if !visible.isEmpty {
            AppCard {
                VStack(alignment: .leading, spacing: 12) {
                    Text(i18n.t("dashboard.quickActions", default: "Quick Actions"))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(visible) { action in
                                Button {
                                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                    container.router.open(action.route)
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: action.icon)
                                            .font(.body.weight(.semibold))
                                        Text(i18n.t(action.labelKey))
                                            .font(.subheadline.weight(.medium))
                                    }
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(Tokens.mist, in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
                                    .foregroundStyle(Tokens.ink)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}
