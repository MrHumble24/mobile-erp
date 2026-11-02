import SwiftUI

/// ─────────────────────────────────────────────────────────────────────────
/// THE EXTENSION POINT — the one shared file feature agents edit.
///
/// To add a feature: define `static let feature: FeatureModule` in your slice
/// (e.g. `Features/Devices/DevicesModule.swift`), then add ONE line to `all`
/// below, in display order. Nothing else in `App/` changes.
///
/// The shell shows entries the signed-in user `can()` see and wraps each root
/// in a permission gate (inline 403) as a safety net.
/// ─────────────────────────────────────────────────────────────────────────
enum FeatureRegistry {
    /// Display order; the shell lands on the first entry (`dashboard`).
    static let all: [FeatureModule] = [
        DashboardModule.feature,
        PosModule.feature,
        SalesModule.feature,
        InventoryModule.feature,
        ShipmentsModule.feature,
        QcModule.feature,
        ConsignmentsModule.feature,
        PartnersModule.feature,
        CustomersModule.feature,
        ExpensesModule.feature,
        ReportsModule.feature,
        UsersModule.feature,
        SettingsModule.feature,
        SyncModule.feature,
    ]
}
