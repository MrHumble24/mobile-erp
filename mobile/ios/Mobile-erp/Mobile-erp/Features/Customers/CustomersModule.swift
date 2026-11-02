import SwiftUI

/// Customers slice. Register with one line in `App/FeatureRegistry.swift`:
///   `CustomersModule.feature,`
/// No `nav.customers` key exists; the label reuses `sales.customersTitle`.
enum CustomersModule {
    static let feature = FeatureModule(
        id: "customers",
        labelKey: "sales.customersTitle",
        systemImage: "person.2",
        permission: "customer.read",
        root: { AnyView(CustomersView()) }
    )
}
