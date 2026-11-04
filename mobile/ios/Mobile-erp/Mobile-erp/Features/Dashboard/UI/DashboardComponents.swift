import SwiftUI

/// Dashboard presentation components (Warm Card): titled section cards, an
/// inline empty row, and the money formatter. The KPI block is the shared
/// `MetricList` (Shared/UI), also used by the sales summary.

func dashMoney(_ value: Double?) -> String {
    guard let value else { return "—" }
    return MoneyText.format(String(value))
}

/// A titled card wrapping a data section; shows loading / error / content.
struct DashSection<Content: View>: View {
    let title: String
    let state: DashLoad
    var retry: (() -> Void)?
    @ViewBuilder var content: () -> Content

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(title)
                    .font(.ui(.heading))
                    .foregroundStyle(Tokens.text)

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

/// Inline "nothing here" row inside a section card (matches Android's compact
/// `EmptyView`): centred tray glyph + muted caption, no full-screen chrome.
struct DashEmptyRow: View {
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            Image(systemName: "tray")
            Text(i18n.t("common.notFound"))
        }
        .font(.ui(.body))
        .foregroundStyle(Tokens.sold)
        .frame(maxWidth: .infinity)
        .padding(.vertical, Tokens.Space.lg)
    }
}

enum DashLoad {
    case loading
    case loaded
    case failed(String)
}
