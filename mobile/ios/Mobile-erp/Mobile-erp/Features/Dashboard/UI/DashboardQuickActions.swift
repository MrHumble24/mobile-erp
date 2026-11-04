import SwiftUI

/// Quick jumps to the busiest screens (POS, inventory, QC, sales, nasiya) via
/// `KitRouter`. A row of equal-width shortcut tiles — surface-2 squircle with
/// the feature's own nav glyph, label below — the same anatomy as the Android
/// `QuickActions` row. Each shows only if the user holds the permission.
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
        Action(route: .pos(), labelKey: "nav.pos", icon: "creditcard", permission: "sale.create"),
        Action(route: .inventory(), labelKey: "nav.inventory", icon: "iphone", permission: "device.read"),
        Action(route: .qc(), labelKey: "nav.qc", icon: "checkmark.seal", permission: "qc.read"),
        Action(route: .sales(), labelKey: "nav.sales", icon: "chart.bar.doc.horizontal", permission: "sale.read"),
        Action(route: .consignments(), labelKey: "nav.consignments",
               icon: "arrow.left.arrow.right", permission: "consignment.read"),
    ]

    private var visible: [Action] { actions.filter { container.session.can($0.permission) } }

    var body: some View {
        if !visible.isEmpty {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                ForEach(visible) { action in
                    Button { container.router.open(action.route) } label: {
                        VStack(spacing: Tokens.Space.sm) {
                            Image(systemName: action.icon)
                                .font(.system(size: 22, weight: .medium))
                                .foregroundStyle(Tokens.text)
                                .frame(width: 52, height: 52)
                                .background(
                                    Tokens.surface2,
                                    in: RoundedRectangle(cornerRadius: Tokens.Radius.buttons, style: .continuous)
                                )
                            Text(i18n.t(action.labelKey))
                                .font(.ui(.label))
                                .foregroundStyle(Tokens.text)
                                .lineLimit(1)
                                .minimumScaleFactor(0.85)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(ShortcutTileStyle())
                }
            }
        }
    }
}

/// Press feedback for a shortcut tile: the Warm Card press (scale 0.98, 120 ms),
/// no highlight on the label.
private struct ShortcutTileStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
