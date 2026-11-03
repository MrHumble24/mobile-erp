import SwiftUI

/// Stack-level String conveniences shared across slices (no business meaning):
/// trimming, sanitizing user inputs (phone numbers and digits/decimals),
/// and operator-entered-money parsing.
extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var trimmedOrNil: String? { let t = trimmed; return t.isEmpty ? nil : t }
    /// Operator-entered money → exact Decimal (nil when blank/invalid).
    var asDecimal: Decimal? { Decimal(string: trimmed) }

    /// Phone number sanitization: keeps leading '+' if present and digits 0-9 only.
    /// Blocks all letters, spaces, and punctuation.
    var sanitizedPhone: String {
        let trimmed = trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return "" }
        let hasLeadingPlus = first == "+"
        let digits = trimmed.filter { $0.isNumber }
        return hasLeadingPlus ? "+\(digits)" : digits
    }

    /// Integer number sanitization: digits 0-9 only.
    /// Blocks all letters, signs, decimals, and punctuation.
    var sanitizedDigits: String {
        filter { $0.isNumber }
    }

    /// Decimal / money input sanitization: allows digits 0-9 and at most one decimal point.
    /// Converts comma to dot for localized decimal input; prepends '0' if user starts with dot; blocks all letters and characters.
    var sanitizedDecimal: String {
        var hasDot = false
        var result = ""
        for ch in self {
            if ch == "." || ch == "," {
                if !hasDot {
                    if result.isEmpty {
                        result.append("0.")
                    } else {
                        result.append(".")
                    }
                    hasDot = true
                }
            } else if ch.isNumber {
                result.append(ch)
            }
        }
        return result
    }
}

// MARK: - SwiftUI View Modifiers for Real-Time Sanitization

extension View {
    /// Sanitizes text to only allow an optional leading '+' and digits 0-9.
    func sanitizePhone(_ text: Binding<String>) -> some View {
        onChange(of: text.wrappedValue) { _, newValue in
            let cleaned = newValue.sanitizedPhone
            if cleaned != newValue {
                text.wrappedValue = cleaned
            }
        }
    }

    /// Sanitizes text to only allow integer digits 0-9.
    func sanitizeDigits(_ text: Binding<String>) -> some View {
        onChange(of: text.wrappedValue) { _, newValue in
            let cleaned = newValue.sanitizedDigits
            if cleaned != newValue {
                text.wrappedValue = cleaned
            }
        }
    }

    /// Sanitizes text to only allow numeric digits 0-9 and at most one decimal dot.
    func sanitizeDecimal(_ text: Binding<String>) -> some View {
        onChange(of: text.wrappedValue) { _, newValue in
            let cleaned = newValue.sanitizedDecimal
            if cleaned != newValue {
                text.wrappedValue = cleaned
            }
        }
    }
}
