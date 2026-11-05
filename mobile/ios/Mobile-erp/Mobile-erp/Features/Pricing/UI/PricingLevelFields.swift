import SwiftUI

/// Three money fields — one per price level (ADR 0034) — reused by the product
/// price editor (per storage row) and the unit own-price sheet. Each field is a
/// Decimal money input; blank means "no price". A trailing hint may show the
/// resolved price that applies when the field is left empty.
struct PricingLevelFields: View {
    /// Current text per level code.
    let text: (String) -> String
    let setText: (String, String) -> Void
    /// Optional resolved-price hint per level (shown when the field is blank).
    var resolvedHint: (String) -> String? = { _ in nil }

    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: Tokens.Space.md) {
            ForEach(PriceLevels.all, id: \.self) { level in
                AppFormField(label: i18n.t(PriceLevels.labelKey(level))) {
                    AppTextField(placeholder: i18n.t("pricing.noPrice"),
                                 text: binding(level),
                                 keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal(binding(level))
                    if text(level).trimmingCharacters(in: .whitespaces).isEmpty,
                       let hint = resolvedHint(level) {
                        Text(hint).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
            }
        }
    }

    private func binding(_ level: String) -> Binding<String> {
        Binding(get: { text(level) }, set: { setText(level, $0.sanitizedDecimal) })
    }
}
