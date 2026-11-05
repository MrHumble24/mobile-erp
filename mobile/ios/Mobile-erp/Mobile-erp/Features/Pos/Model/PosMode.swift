import Foundation

/// The till's two modes (ADR 0031): Scan (type/scan a code) and Catalog (tap a
/// product card). Both feed the same cart; the choice is remembered per device.
enum PosMode: String, CaseIterable {
    case scan, catalog

    private static let key = "posMode"

    static func loadRemembered() -> PosMode {
        PosMode(rawValue: UserDefaults.standard.string(forKey: key) ?? "") ?? .scan
    }

    static func remember(_ mode: PosMode) {
        UserDefaults.standard.set(mode.rawValue, forKey: key)
    }

    var labelKey: String { self == .scan ? "catalog.scanMode" : "catalog.catalogMode" }
}
