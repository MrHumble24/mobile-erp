import Foundation

/// Thermal receipt formatting helpers and paper width definitions (ADR 0043, ADR 0047).
/// Character counts per line for 58 mm and 80 mm are defined in one place here.
enum BonusReceiptLayout {
    static let width58Columns = 32
    static let width80Columns = 48

    static func lineWidth(for widthMm: Int) -> Int {
        widthMm == 58 ? width58Columns : width80Columns
    }

    static func rule(width: Int) -> String {
        String(repeating: "-", count: max(10, width))
    }

    static func headerLines(name: String?, address: String?, phone: String?) -> [String] {
        [name, address, phone]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    static func row(_ label: String, _ value: String, width: Int) -> String {
        let padding = width - label.count - value.count
        if padding >= 1 {
            return label + String(repeating: " ", count: padding) + value
        } else {
            return label + " " + value
        }
    }
}
