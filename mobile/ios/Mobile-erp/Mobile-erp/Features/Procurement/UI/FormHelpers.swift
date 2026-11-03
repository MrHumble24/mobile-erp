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
                .foregroundStyle(.secondary)
            TextField(label, text: $text)
                .keyboardType(keyboard)
                .autocorrectionDisabled(mono)
                .textInputAutocapitalization(mono ? .characters : .sentences)
                .font(mono ? .mono(15) : .body)
        }
        .padding(.vertical, 2)
    }
}
