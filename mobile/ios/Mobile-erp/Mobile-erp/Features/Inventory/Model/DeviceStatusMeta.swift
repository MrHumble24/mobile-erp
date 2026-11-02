import SwiftUI

/// Status presentation + the manual transitions a user may trigger from the
/// device sheet. CONSIGNED and SOLD targets are side effects of POS / Nasiya
/// (ADR 0012), so they are deliberately absent even though the server allows
/// them. The allowed set is plain data — adding one is a data edit, not new UI.
enum DeviceStatusMeta {
    static let statusCodes = ["IN_STOCK", "DEFECTIVE", "CONSIGNED", "SOLD"]

    private static let labelKeys = [
        "IN_STOCK": "inventory.statusInStock",
        "DEFECTIVE": "inventory.statusDefective",
        "CONSIGNED": "inventory.statusConsigned",
        "SOLD": "inventory.statusSold",
    ]

    private static let manualTransitions: [String: [String]] = [
        "IN_STOCK": ["DEFECTIVE"],
        "DEFECTIVE": ["IN_STOCK"],
        "SOLD": ["IN_STOCK", "DEFECTIVE"],
        "CONSIGNED": [],
    ]

    static func labelKey(_ code: String) -> String { labelKeys[code] ?? code }

    static func color(_ code: String) -> Color { Tokens.deviceStatusColor(code) }

    static func transitions(for code: String) -> [String] { manualTransitions[code] ?? [] }
}
