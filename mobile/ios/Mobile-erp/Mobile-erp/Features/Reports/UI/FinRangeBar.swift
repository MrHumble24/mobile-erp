import SwiftUI

/// Shared report date-range control: a preset menu plus, for `custom`, the
/// kit's from/to date field (`KitDateRangeField`).
struct FinRangeBar: View {
    @Binding var range: FinReportRange
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack(spacing: 10) {
            Menu {
                ForEach(FinRangePreset.allCases) { preset in
                    Button(i18n.t(preset.labelKey)) {
                        Haptic.tick.play()
                        range.preset = preset
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "calendar")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Tokens.signalBlue)
                    Text(i18n.t(range.preset.labelKey))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Tokens.ink)
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption2)
                        .foregroundStyle(Tokens.muted)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Tokens.surface, in: Capsule())
                .overlay(Capsule().strokeBorder(Tokens.hairline, lineWidth: 1))
            }

            if range.preset == .custom {
                KitDateRangeField(range: Binding(
                    get: { KitDateRange(from: range.customFrom, to: range.customTo) },
                    set: { range.customFrom = $0.from; range.customTo = $0.to }
                ))
            }
            Spacer()
        }
        .padding(.horizontal, 16)
    }
}
