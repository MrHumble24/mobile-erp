import SwiftUI

/// Sales & warranty slice. Register with one line in `App/FeatureRegistry.swift`:
///   `SalesModule.feature,`
enum SalesModule {
    static let feature = FeatureModule(
        id: "sales",
        labelKey: "nav.sales",
        systemImage: "chart.bar.doc.horizontal",
        permission: "sale.read",
        root: { AnyView(SalesView()) }
    )
}
