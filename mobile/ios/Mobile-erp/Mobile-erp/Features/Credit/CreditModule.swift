import SwiftUI

/// The credits list feature (ADR 0035). A finance screen in the More tab next to
/// Balance and Reports, gated on `sale.read`. Selling on credit happens at the
/// till (`Features/Pos`); this is the list, detail, payments and the contract.
enum CreditModule {
    static let feature = FeatureModule(
        id: "credits",
        labelKey: "credit.title",
        systemImage: "banknote",
        permission: "sale.read",
        root: { AnyView(CreditsView()) }
    )
}
