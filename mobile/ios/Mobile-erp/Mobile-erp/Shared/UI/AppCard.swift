import SwiftUI

/// The default grouped-content container: Caldera radius 12 with a bone
/// hairline in light mode (a subtle separator in dark). Fills the system
/// grouped-background surface so it adapts to Dark Mode.
struct AppCard<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .strokeBorder(Tokens.hairline, lineWidth: 1)
            )
    }
}
