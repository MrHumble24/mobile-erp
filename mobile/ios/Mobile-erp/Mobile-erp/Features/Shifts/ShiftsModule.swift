import SwiftUI

/// The shifts list feature (ADR 0036). A screen in the More tab (`sale.read`);
/// opening / closing happens at the till (`Features/Pos`, the shift bar).
enum ShiftsModule {
    static let feature = FeatureModule(
        id: "shifts",
        labelKey: "shifts.title",
        systemImage: "clock.arrow.circlepath",
        permission: "sale.read",
        root: { AnyView(ShiftsView()) }
    )
}
