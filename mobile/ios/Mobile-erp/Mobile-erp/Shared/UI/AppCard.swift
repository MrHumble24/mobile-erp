import SwiftUI

/// The default content container (DESIGN.md): a white `card`, radius 16, 20 pt
/// padding, **no border and no shadow** — contrast against the warm ground is
/// the edge.
struct AppCard<Content: View>: View {
    var padding: CGFloat = Tokens.Space.cardPad
    var backgroundColor: Color = Tokens.card
    /// Deprecated under Warm Card: cards have no border. Kept so the screens that
    /// have not yet adopted the new kit still compile; it is ignored.
    var borderColor: Color = Tokens.border
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
    }
}
