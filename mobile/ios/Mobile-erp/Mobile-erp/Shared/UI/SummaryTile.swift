import SwiftUI

/// A generic summary tile — label over a value (plus optional subtext) in an
/// `AppCard`. `highlight` inverts it (ink fill) for a flagged value, matching
/// the web `MetricCard` `dark` variant. Zero business meaning: lives in
/// `shared/ui` and is reused by any slice that shows stat tiles.
struct SummaryTile: View {
    let label: String
    let value: String
    var subtext: String?
    var highlight = false

    var body: some View {
        AppCard(padding: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(highlight ? Color.white.opacity(0.75) : .secondary)
                    .lineLimit(1)
                Text(value)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(highlight ? .white : Tokens.ink)
                    .monospacedDigit()
                if let subtext {
                    Text(subtext)
                        .font(.caption2)
                        .foregroundStyle(highlight ? Color.white.opacity(0.75) : .secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(
            highlight
                ? RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .fill(Tokens.ink)
                : nil
        )
    }
}

/// Roomy single-column stack wrapper for `SummaryTile`s, shared by the sales and
/// customer summaries. Avoids multi-column grids so large monetary amounts never truncate.
struct SummaryTileGrid<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        VStack(spacing: 10) { content }
    }
}
