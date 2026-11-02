import SwiftUI

/// Nav entry for the partner directory (`partner.read`). One of the two modules
/// this slice group registers; the integrator adds the line to `FeatureRegistry`.
enum PartnersModule {
    static let feature = FeatureModule(
        id: "partners",
        labelKey: "nav.partners",
        systemImage: "person.2",
        permission: "partner.read",
        root: { AnyView(PartnersView()) }
    )
}
