import SwiftUI

/// Reports slice wiring. Register with ONE line in `App/FeatureRegistry.swift`:
///   `ReportsModule.feature`
enum ReportsModule {
    static let feature = FeatureModule(
        id: "reports",
        labelKey: "nav.reports",
        systemImage: "chart.bar",
        permission: "report.finance",
        root: { AnyView(ReportsView()) }
    )
}
