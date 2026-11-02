import SwiftUI

/// One summary tile — label over a value, in an `AppCard`. `highlight` inverts
/// it (ink fill) to flag a non-zero overdue count, matching the web `dark`
/// metric-card variant. Money values are passed pre-formatted.
struct ConsignmentMetricTile: View {
    let label: String
    let value: String
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
