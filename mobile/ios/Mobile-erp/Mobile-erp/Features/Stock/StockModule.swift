import SwiftUI

/// Quantity-product stock (ADR 0030): the counted products with their on-hand
/// quantity, price and — for cost users — average cost and value. Next to
/// Inventory, visible with `device.read`. Registered with one line in
/// `FeatureRegistry`.
enum StockModule {
    static let feature = FeatureModule(
        id: "stock",
        labelKey: "nav.stock",
        systemImage: "shippingbox",
        permission: "device.read",
        root: { AnyView(StockView()) }
    )
}
