import SwiftUI

/// One KPI row: muted label (+ caption) left, mono figure right. Zero business
/// meaning; the dashboard and the sales summary both stack these in a
/// `MetricList` — the compact list-card the Android `MetricGrid` draws on phones.
struct MetricRow: View {
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

/// One white card, rows split by hairline dividers.
struct MetricList: View {
    let rows: [MetricRow]

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
