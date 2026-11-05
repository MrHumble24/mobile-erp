import SwiftUI

/// Buying used phones from customers (Change 14, ADR 0039). A More-tab screen
/// gated on `purchase.read`: the purchases list + the "Buy a phone" sheet. The
/// till's trade-in lives in `Features/Pos`. Online only.
enum PurchasesModule {
    static let feature = FeatureModule(
        id: "purchases",
        labelKey: "purchases.title",
        systemImage: "arrow.down.circle",
        permission: "purchase.read",
        root: { AnyView(PurchasesView()) }
    )
}
