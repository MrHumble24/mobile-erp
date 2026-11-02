import SwiftUI

/// POS terminal slice. Register with one line in `App/FeatureRegistry.swift`:
///   `PosModule.feature,`
enum PosModule {
    static let feature = FeatureModule(
        id: "pos",
        labelKey: "nav.pos",
        systemImage: "creditcard",
        permission: "sale.create",
        root: { AnyView(PosView()) }
    )
}
