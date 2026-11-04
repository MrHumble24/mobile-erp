import SwiftUI

/// A labelled text row for use inside a stock `Form`. The label doubles as the
/// placeholder — the standard iOS grouped-form look, so system chrome/glass
/// applies for free.
struct LabeledField: View {
    let label: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var mono = false

    init(_ label: String, text: Binding<String>, keyboard: UIKeyboardType = .default, mono: Bool = false) {
        self.label = label
        self._text = text
        self.keyboard = keyboard
        self.mono = mono
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(Tokens.muted)
            TextField(label, text: $text)
                .keyboardType(keyboard)
                .autocorrectionDisabled(mono || keyboard != .default)
                .textInputAutocapitalization(mono ? .characters : (keyboard == .default ? .sentences : .never))
                .font(mono ? .mono(15) : .body)
        }
        .padding(.vertical, 2)
        .modifier(AutoSanitize(keyboard: keyboard, text: $text))
    }
}

/// Automatically hooks real-time input sanitization based on the field's keyboard type.
private struct AutoSanitize: ViewModifier {
    let keyboard: UIKeyboardType
    @Binding var text: String

    func body(content: Content) -> some View {
        switch keyboard {
        case .phonePad:
            content.sanitizePhone($text)
        case .numberPad:
            content.sanitizeDigits($text)
        case .decimalPad:
            content.sanitizeDecimal($text)
        default:
            content
        }
    }
}
