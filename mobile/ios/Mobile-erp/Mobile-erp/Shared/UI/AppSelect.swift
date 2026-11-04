import SwiftUI

/// Warm Card dropdown: a `Menu` dressed as an `AppTextField` (card fill, warm
/// border, radius 12, 52 pt) with a chevron. Platform menu behaviour is kept;
/// only the trigger is themed.
struct AppSelect<Value: Hashable>: View {
    let placeholder: String
    @Binding var selection: Value
    let options: [(value: Value, label: String)]

    private var currentLabel: String {
        options.first { $0.value == selection }?.label ?? placeholder
    }

    var body: some View {
        Menu {
            ForEach(options, id: \.value) { option in
                Button(option.label) { selection = option.value }
            }
        } label: {
            HStack(spacing: Tokens.Space.sm) {
                Text(currentLabel)
                    .font(.ui(.body))
                    .foregroundStyle(options.contains { $0.value == selection } ? Tokens.text : Tokens.muted)
                Spacer(minLength: 0)
                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Tokens.muted)
            }
            .frame(height: Tokens.Space.controlH)
            .padding(.horizontal, Tokens.Space.lg)
            .background(
                RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                    .fill(Tokens.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                    .strokeBorder(Tokens.border, lineWidth: 1)
            )
        }
    }
}
