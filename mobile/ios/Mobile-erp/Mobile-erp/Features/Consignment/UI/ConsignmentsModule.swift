import SwiftUI

/// Nav entry for the consignments list (`consignment.read`). The second of the
/// two modules this slice group registers.
enum ConsignmentsModule {
    static let feature = FeatureModule(
        id: "consignments",
        labelKey: "nav.consignments",
        systemImage: "arrow.left.arrow.right",
        permission: "consignment.read",
        root: { AnyView(ConsignmentsView()) }
    )
}
