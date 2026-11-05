import SwiftUI

/// Repairs (Change 13, ADR 0040). A More-tab screen gated on `repair.read` AND
/// hidden entirely while `repairsEnabled` is off (`isEnabled`). Online only.
enum RepairsModule {
    static let feature = FeatureModule(
        id: "repairs",
        labelKey: "repairs.title",
        labelFallback: "Repairs",
        systemImage: "wrench.and.screwdriver",
        permission: "repair.read",
        isEnabled: { $0.storeFlags.repairsEnabled },
        root: { AnyView(RepairsView()) }
    )
}
