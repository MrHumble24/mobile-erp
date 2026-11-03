import SwiftUI

/// One summary tile — label over a value, in an `AppCard`.
/// When `highlight` is true (non-zero overdue count), a high-visibility danger wash
/// is applied with WCAG-compliant contrast in both light and dark mode.
struct ConsignmentMetricTile: View {
    let label: String
    let value: String
    var highlight = false

    var body: some View {
        AppCard(
            padding: 14,
            backgroundColor: highlight ? Tokens.badBg : Tokens.surface,
            borderColor: highlight ? Tokens.danger.opacity(0.35) : Tokens.hairline
        ) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(label)
                        .font(.caption.weight(highlight ? .semibold : .regular))
                        .foregroundStyle(highlight ? Tokens.danger : .secondary)
                        .lineLimit(1)
                    if highlight {
                        Spacer()
                        Image(systemName: "clock.badge.exclamationmark")
                            .font(.caption)
                            .foregroundStyle(Tokens.danger)
                    }
                }
                Text(value)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(highlight ? Tokens.danger : Tokens.ink)
                    .monospacedDigit()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
