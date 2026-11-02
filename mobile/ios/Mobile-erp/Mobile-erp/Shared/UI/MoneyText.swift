import SwiftUI

/// Renders a money value from the server's Decimal **string** in the Sometype
/// Mono face. Never parse money as a Double — `Decimal(string:)` keeps it
/// exact. Formats grouped USD, dropping cents when the amount is whole.
struct MoneyText: View {
    let value: String?
    var size: CGFloat = 16
    var suffix: String?

    var body: some View {
        Text(Self.format(value, suffix: suffix))
            .font(.mono(size))
            .monospacedDigit()
    }

    static func format(_ value: String?, suffix: String? = nil) -> String {
        let amount = Decimal(string: value ?? "") ?? .zero
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "$"
        formatter.locale = Locale(identifier: "en_US")
        let whole = amount == amount.rounded() // integer-valued
        formatter.maximumFractionDigits = whole ? 0 : 2
        formatter.minimumFractionDigits = whole ? 0 : 2
        let text = formatter.string(from: amount as NSDecimalNumber) ?? "$0"
        return suffix.map { "\(text) \($0)" } ?? text
    }
}

private extension Decimal {
    func rounded() -> Decimal {
        var result = Decimal(), value = self
        NSDecimalRound(&result, &value, 0, .plain)
        return result
    }
}
