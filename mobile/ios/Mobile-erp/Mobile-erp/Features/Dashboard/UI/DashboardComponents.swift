import SwiftUI

/// Dashboard presentation components (Warm Card): one list-card of KPI rows,
/// titled section cards, an inline empty row, and the money formatter.
/// Mirrors the Android `MetricGrid` compact list-card so both apps read alike.

func dashMoney(_ value: Double?) -> String {
    guard let value else { return "—" }
    return MoneyText.format(String(value))
}

/// One KPI row: muted label (+ caption) left, mono figure right.
struct DashMetricRow: View {
    let label: String
    let value: String
    var subtext: String?
    var emphasis: Color?

    var body: some View {
        HStack(alignment: .center, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.ui(.label))
                    .foregroundStyle(Tokens.muted)
                if let subtext {
                    Text(subtext)
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                }
            }
            Spacer(minLength: Tokens.Space.sm)
            Text(value)
                .font(.mono(17, weight: .semibold))
                .foregroundStyle(emphasis ?? Tokens.text)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(minHeight: Tokens.Space.rowH)
        .padding(.horizontal, Tokens.Space.cardPad)
        .padding(.vertical, Tokens.Space.sm)
    }
}

/// The KPI block: one white card, rows split by hairline dividers.
struct DashMetricList: View {
    let rows: [DashMetricRow]

    var body: some View {
        AppCard(padding: 0) {
            VStack(spacing: 0) {
                ForEach(Array(rows.enumerated()), id: \.offset) { i, row in
                    row
                    if i < rows.count - 1 {
                        Divider().overlay(Tokens.border)
                    }
                }
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
