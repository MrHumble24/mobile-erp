import SwiftUI

/// Online storefront orders (handoff 029, ADR 0049/0050). A More-tab screen gated
/// on `order.read`, with a NEW-order badge on its row. Online only.
enum OrdersModule {
    static let feature = FeatureModule(
        id: "orders",
        labelKey: "nav.orders",
        labelFallback: "Orders",
        systemImage: "bag",
        permission: "order.read",
        root: { AnyView(OrdersView()) }
    )
}
