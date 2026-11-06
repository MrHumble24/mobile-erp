import SwiftUI

/// Renders and formats loyalty bonus points (ADR 0043, ADR 0047).
/// Points are numbers, never money: thousands grouped with space, no currency,
/// trailing ".00" dropped (e.g. "1450.00" → "1 450", "12.50" → "12.5", "-300.00" → "-300", nil/junk → "0").
struct BonusText: View {
    let value: String?
    var size: CGFloat = 16

    var body: some View {
        Text(Self.format(value))
            .font(.mono(size))
            .monospacedDigit()
    }

    static func format(_ value: String?) -> String {
        guard let v = value, !v.isEmpty, let amount = Decimal(string: v) else { return "0" }
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = " "
        formatter.decimalSeparator = "."
        formatter.usesGroupingSeparator = true
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2
        return formatter.string(from: amount as NSDecimalNumber) ?? "0"
    }

    static func format(_ value: Double) -> String {
        format(String(value))
    }
}
