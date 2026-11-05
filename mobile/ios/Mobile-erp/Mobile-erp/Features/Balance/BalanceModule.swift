import SwiftUI

/// Store Balance slice wiring. Register with ONE line in
/// `App/FeatureRegistry.swift` (finance group, next to Expenses):
///   `BalanceModule.feature`
enum BalanceModule {
    static let feature = FeatureModule(
        id: "balance",
        labelKey: "nav.balance",
        systemImage: "banknote",
        permission: "balance.read",
        root: { AnyView(BalanceView()) }
    )
}
