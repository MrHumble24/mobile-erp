import SwiftUI

/// The default grouped-content container: Ink radius 12 with a 1 pt hairline
/// border (cards are separated by hairline, not tone). Fills `Tokens.surface`
/// so it adapts to Dark Mode.
struct AppCard<Content: View>: View {
    var padding: CGFloat = 16
    var backgroundColor: Color = Tokens.surface
    var borderColor: Color = Tokens.hairline
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .strokeBorder(borderColor, lineWidth: 1)
            )
    }
}
