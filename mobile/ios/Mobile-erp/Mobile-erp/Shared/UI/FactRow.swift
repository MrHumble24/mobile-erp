import SwiftUI

/// Keyed fact row for detail sheets: muted caption label left, the value
/// right, a hairline below unless `last`. Inner text may set its own colour.
struct FactRow<V: View>: View {
    let label: String
    var last = false
    @ViewBuilder var value: () -> V

    var body: some View {
        HStack(spacing: Tokens.Space.md) {
            Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Spacer(minLength: Tokens.Space.md)
            value().foregroundStyle(Tokens.text).multilineTextAlignment(.trailing)
        }
        .frame(minHeight: Tokens.Space.minTouch)
        if !last { Divider().overlay(Tokens.border) }
    }
}
