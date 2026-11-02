import SwiftUI

/// Dashboard slice wiring. Register with ONE line in `App/FeatureRegistry.swift`:
///   `DashboardModule.feature`
/// Auth-only (no section permission): each data card inside is gated by the
/// permission its endpoint needs, so a cashier sees only what they may read.
/// The integrator makes this the shell's start destination.
enum DashboardModule {
    static let feature = FeatureModule(
        id: "dashboard",
        labelKey: "nav.dashboard",
        systemImage: "square.grid.2x2",
        permission: nil,
        root: { AnyView(DashboardView()) }
    )
}
