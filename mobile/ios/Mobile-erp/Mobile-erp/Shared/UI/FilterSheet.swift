import SwiftUI

/// Warm Card filter sheet: a title, scrollable content, and a reset / close pair
/// of `PillButton`s. Rises with the shared `AppBottomSheet` chrome. Copy is the
/// caller's (localized strings in, no keys here).
struct FilterSheet<Content: View>: View {
    let title: String
    let resetLabel: String
    let closeLabel: String
    let onReset: () -> Void
    let onClose: () -> Void
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
            Text(title)
                .font(.ui(.title))
                .foregroundStyle(Tokens.text)

            ScrollView {
                VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                    content()
                }
            }
            .scrollBounceBehavior(.basedOnSize)

            HStack(spacing: Tokens.Space.md) {
                Button(resetLabel, action: onReset)
                    .buttonStyle(.pillSecondary)
                    .frame(maxWidth: .infinity)
                Button(closeLabel, action: onClose)
                    .buttonStyle(.pillPrimary)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(Tokens.Space.gutter)
        .frame(maxWidth: .infinity, alignment: .leading)
        .appBottomSheet()
    }
}
