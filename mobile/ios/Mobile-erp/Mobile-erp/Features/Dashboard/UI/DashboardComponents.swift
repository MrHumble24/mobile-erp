import SwiftUI

/// Dashboard presentation components: roomy, single-column KPI cards,
/// titled sections, and monetary formatting helpers.
/// Strictly avoids multi-column grids so executive numbers are uncompressed.

func dashMoney(_ value: Double?) -> String {
    guard let value else { return "—" }
    return MoneyText.format(String(value))
}

struct DashTile: View {
    let label: String
    let value: String
    var subtext: String?
    var emphasis: Color?

    var body: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text(label)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(emphasis ?? Tokens.ink)
                    .monospacedDigit()
                if let subtext {
                    Text(subtext)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Single-column vertical stack of dashboard KPI cards.
struct DashTileGrid: View {
    let tiles: [DashTile]

    var body: some View {
        VStack(spacing: 12) {
            ForEach(Array(tiles.enumerated()), id: \.offset) { _, tile in
                tile
            }
        }
    }
}

/// A titled card wrapping a data section; shows loading / error / content.
struct DashSection<Content: View>: View {
    let title: String
    let state: DashLoad
    var retry: (() -> Void)?
    @ViewBuilder var content: () -> Content

    var body: some View {
        AppCard(padding: 16) {
            VStack(alignment: .leading, spacing: 14) {
                Text(title)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(Tokens.ink)

                switch state {
                case .loading:
                    LoadingView().frame(height: 80)
                case .failed(let msg):
                    ErrorStateView(message: msg, retry: retry)
                case .loaded:
                    content()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

enum DashLoad {
    case loading
    case loaded
    case failed(String)
}
