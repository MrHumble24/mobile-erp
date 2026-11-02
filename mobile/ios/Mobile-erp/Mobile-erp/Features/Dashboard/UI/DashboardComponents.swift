import SwiftUI

/// Dashboard-local presentation pieces (the slice may not import reports): a KPI
/// tile, a responsive grid, a card with a title, and the money helper.

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
        AppCard {
            VStack(alignment: .leading, spacing: 6) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Text(value).font(.title3.weight(.semibold))
                    .foregroundStyle(emphasis ?? Tokens.ink).monospacedDigit()
                if let subtext {
                    Text(subtext).font(.caption2).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct DashTileGrid: View {
    let tiles: [DashTile]
    @Environment(\.horizontalSizeClass) private var sizeClass

    var body: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 12),
                            count: sizeClass == .regular ? 4 : 2)
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(Array(tiles.enumerated()), id: \.offset) { $0.element }
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
        AppCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title).font(.subheadline.weight(.medium))
                switch state {
                case .loading: LoadingView().frame(height: 80)
                case .failed(let message): ErrorStateView(message: message, retry: retry)
                case .loaded: content()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

enum DashLoad: Equatable {
    case loading
    case loaded
    case failed(String)
}
