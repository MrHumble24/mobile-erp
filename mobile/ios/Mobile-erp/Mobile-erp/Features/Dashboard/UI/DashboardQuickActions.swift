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
                    Text(i18n.t("dashboard.quickActions", default: "Quick actions"))
                        .font(.subheadline.weight(.medium))
                    let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 3)
                    LazyVGrid(columns: columns, spacing: 10) {
                        ForEach(visible) { action in
                            Button { container.router.open(action.route) } label: {
                                VStack(spacing: 6) {
                                    Image(systemName: action.icon).font(.title3)
                                    Text(i18n.t(action.labelKey)).font(.caption).lineLimit(1)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Tokens.mist, in: RoundedRectangle(cornerRadius: Tokens.Radius.cards))
                                .foregroundStyle(Tokens.ink)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}
