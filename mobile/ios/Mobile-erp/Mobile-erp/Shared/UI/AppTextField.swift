import SwiftUI

/// Warm Card text field (DESIGN.md): 52 pt, radius 12, white `card` fill, a 1 pt
/// warm border that becomes a 2 pt `action` ring on focus. The one place a raw
/// `TextField` may appear (shared/ui wraps it once).
struct AppTextField: View {
    let placeholder: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    var disableAutocorrection = false
    /// Override for data entry (IMEI, money): pass `.mono(15)`.
    var font: Font = .ui(.body)

    @FocusState private var focused: Bool

    var body: some View {
        TextField(placeholder, text: $text)
            .font(font)
            .foregroundStyle(Tokens.text)
            .tint(Tokens.action)
            .keyboardType(keyboard)
            .textInputAutocapitalization(autocapitalization)
            .autocorrectionDisabled(disableAutocorrection)
            .focused($focused)
            .frame(height: Tokens.Space.controlH)
            .padding(.horizontal, Tokens.Space.lg)
            .background(
                RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                    .fill(Tokens.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                    .strokeBorder(focused ? Tokens.text : Tokens.border,
                                  lineWidth: focused ? 2 : 1)
            )
            .animation(.easeOut(duration: 0.12), value: focused)
    }
}

/// A labelled field: the keyed label (Onest label, muted) over any field view —
/// `AppTextField`, `AppSelect`, or a custom control.
struct AppFormField<Field: View>: View {
    let label: String
    @ViewBuilder var field: () -> Field

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(label)
                .font(.ui(.label))
                .foregroundStyle(Tokens.muted)
            field()
        }
    }
}
