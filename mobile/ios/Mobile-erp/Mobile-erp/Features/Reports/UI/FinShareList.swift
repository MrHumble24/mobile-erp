import SwiftUI

/// One row of a breakdown share list: label, preformatted value and 0–1 share.
struct FinShareRow: Identifiable {
    let key: String
    let label: String
    let value: String
    let share: Double
    var id: String { key }
}

/// Tappable list of breakdown rows shown under a `BarChartCard` — the mobile
/// stand-in for the web share-table, and the drill-down entry point. Rows are
/// buttons only when `onSelect` is set.
struct FinShareList: View {
    let rows: [FinShareRow]
    var onSelect: ((String) -> Void)?

    var body: some View {
        AppCard {
            VStack(spacing: 0) {
                ForEach(rows) { row in
                    if let onSelect {
                        Button { onSelect(row.key) } label: { content(row) }
                            .buttonStyle(.plain)
                    } else {
                        content(row)
                    }
                    if row.id != rows.last?.id { Divider() }
                }
            }
        }
    }

    private func content(_ row: FinShareRow) -> some View {
        HStack(spacing: 10) {
            Text(row.label).font(.subheadline).lineLimit(1)
            Spacer()
            Text(row.value).font(.mono(14))
            Text("\(Int((row.share * 100).rounded()))%")
                .font(.caption2).foregroundStyle(Tokens.muted)
                .frame(width: 38, alignment: .trailing)
            if onSelect != nil {
                Image(systemName: "chevron.right").font(.caption2).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 10)
        .contentShape(Rectangle())
    }
}
