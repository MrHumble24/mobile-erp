import SwiftUI

/// A date control in the kit's field chrome (card fill, hairline, 52 pt).
struct AppDateField: View {
    @Binding var date: Date

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            Image(systemName: "calendar").foregroundStyle(Tokens.muted)
            DatePicker("", selection: $date, displayedComponents: .date)
                .labelsHidden()
                .tint(Tokens.action)
            Spacer(minLength: 0)
        }
        .frame(height: Tokens.Space.controlH)
        .padding(.horizontal, Tokens.Space.lg)
        .background(RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous).fill(Tokens.card))
        .overlay(RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous).strokeBorder(Tokens.border, lineWidth: 1))
    }
}
