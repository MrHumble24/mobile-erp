import SwiftUI

/// Expenses slice wiring. Register with ONE line in `App/FeatureRegistry.swift`:
///   `ExpensesModule.feature`
enum ExpensesModule {
    static let feature = FeatureModule(
        id: "expenses",
        labelKey: "nav.expenses",
        systemImage: "receipt",
        permission: "expense.read",
        root: { AnyView(ExpensesView()) }
    )
}
