import SwiftUI

/// A generic summary tile — label over a value (plus optional subtext) in an
/// `AppCard`. `highlight` inverts it (ink fill) for a flagged value, matching
/// the web `MetricCard` `dark` variant. Zero business meaning: lives in
/// `shared/ui` and is reused by any slice that shows stat tiles.
struct SummaryTile: View {
    let label: String
    let value: String
    var subtext: String?
    /// Retained for call-site compatibility. Warm Card does not invert tiles
    /// (orange is for pressables only); emphasis is a later adoption pass.
    var highlight = false

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(label)
                    .font(.ui(.caption))
                    .foregroundStyle(Tokens.muted)
                    .lineLimit(1)
                Text(value)
                    .font(.data(.large))
                    .foregroundStyle(Tokens.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                if let subtext {
                    Text(subtext)
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Roomy single-column stack wrapper for `SummaryTile`s, shared by the sales and
/// customer summaries. Avoids multi-column grids so large monetary amounts never truncate.
struct SummaryTileGrid<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        VStack(spacing: Tokens.Space.md) { content }
    }
}
