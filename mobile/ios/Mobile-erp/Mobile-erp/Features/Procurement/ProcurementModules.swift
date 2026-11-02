import SwiftUI

/// Procurement & QC slice group. Exposes two shell entries — Shipments (with a
/// Suppliers sub-tab) and QC — kept in one slice so QC can reuse the shipments
/// device/model reads without a cross-slice import. The integrator adds both
/// lines to `FeatureRegistry`.

enum ShipmentsModule {
    static let feature = FeatureModule(
        id: "shipments",
        labelKey: "nav.shipments",
        systemImage: "shippingbox",
        permission: "shipment.read",
        root: { AnyView(ShipmentsScreen()) }
    )
}

enum QcModule {
    static let feature = FeatureModule(
        id: "qc",
        labelKey: "nav.qc",
        systemImage: "checkmark.seal",
        permission: "qc.read",
        root: { AnyView(QcScreen()) }
    )
}
