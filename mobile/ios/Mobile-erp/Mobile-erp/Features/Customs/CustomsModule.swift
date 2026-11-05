import SwiftUI

/// Customs price-list slice wiring (ADR 0027). Register with ONE line in
/// `App/FeatureRegistry.swift` (finance group, next to Reports):
///   `CustomsModule.feature`
enum CustomsModule {
    static let feature = FeatureModule(
        id: "customs",
        labelKey: "nav.customs",
        systemImage: "doc.text.magnifyingglass",
        permission: "customs.read",
        root: { AnyView(CustomsView()) }
    )
}
