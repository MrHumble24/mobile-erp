import SwiftUI

/// Discount editor for one cart line or the whole sale (ADR 0034). Percent or
/// amount as the settings allow, the preset values as quick chips, the final
/// price shown live, and the seller stopped before the server: above the limit
/// shows `pricing.errorDiscountTooHigh`, above the price `errorDiscountAboveList`.
struct PosDiscountSheet: View {
    let title: String
    /// The base list price the discount bites into (the line's, or the cart's).
    let list: Decimal
    let config: PosDiscountConfig
    let cap: Decimal
    /// Current mode/value (prefill) and the apply/clear callbacks.
    let initialMode: PosDiscountMode
    let initialValue: String
    let onApply: (PosDiscountMode, String) -> Void
    let onClear: () -> Void

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var mode: PosDiscountMode
    @State private var value: String

    init(title: String, list: Decimal, config: PosDiscountConfig, cap: Decimal,
         initialMode: PosDiscountMode, initialValue: String,
         onApply: @escaping (PosDiscountMode, String) -> Void, onClear: @escaping () -> Void) {
        self.title = title
        self.list = list
        self.config = config
        self.cap = cap
        self.initialMode = initialMode
        self.initialValue = initialValue
        self.onApply = onApply
        self.onClear = onClear
        let startMode = initialMode == .none ? (config.allowedModes.first ?? .percent) : initialMode
        _mode = State(initialValue: startMode)
        _value = State(initialValue: initialValue)
    }

    private var decimalValue: Decimal { Decimal(string: value.trimmingCharacters(in: .whitespaces)) ?? 0 }
    private var finalPrice: Decimal { PricingMath.finalPrice(list: list, mode: mode, value: decimalValue) }
    private var errorKey: String? {
        PricingMath.validate(mode: mode, value: decimalValue, list: list, cap: cap,
                             unlimited: config.canDiscountUnlimited)
    }
    private var presets: [Decimal] { mode == .percent ? config.presetsPercent : config.presetsAmount }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: title) { dismiss() }
                if config.allowedModes.count > 1 {
                    SegmentedControl(selection: $mode,
                                     segments: config.allowedModes.map { ($0, i18n.t(modeKey($0))) })
                }
                AppFormField(label: i18n.t("pricing.discount")) {
                    AppTextField(placeholder: "0", text: $value,
                                 keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal($value)
                }
                if !presets.isEmpty { chips }
                priceBlock
                if let errorKey {
                    Text(errorText(errorKey)).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                }
                HStack(spacing: Tokens.Space.md) {
                    Button(i18n.t("pricing.noDiscount"), role: .destructive) {
                        onClear(); dismiss()
                    }
                    .buttonStyle(.pillGhost)
                    Button(i18n.t("common.save")) { onApply(mode, value); dismiss() }
                        .buttonStyle(.pillPrimary)
                        .disabled(errorKey != nil)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    private var chips: some View {
        HStack(spacing: Tokens.Space.sm) {
            ForEach(presets, id: \.self) { preset in
                Button(presetLabel(preset)) {
                    value = NSDecimalNumber(decimal: preset).stringValue
                }
                .buttonStyle(.pillSecondary)
            }
        }
    }

    private var priceBlock: some View {
        VStack(spacing: 0) {
            FactRow(label: i18n.t("pricing.listPrice")) {
                MoneyText(value: NSDecimalNumber(decimal: list).stringValue, size: 15)
            }
            FactRow(label: i18n.t("pricing.finalPrice"), last: true) {
                MoneyText(value: NSDecimalNumber(decimal: finalPrice).stringValue, size: 15)
                    .fontWeight(.semibold)
            }
        }
    }

    private func modeKey(_ m: PosDiscountMode) -> String {
        m == .percent ? "pricing.discountPercent" : "pricing.discountAmount"
    }
    private func presetLabel(_ preset: Decimal) -> String {
        let n = NSDecimalNumber(decimal: preset).stringValue
        return mode == .percent ? "\(n)%" : MoneyText.format(n)
    }
    private func errorText(_ key: String) -> String {
        key == "pricing.errorDiscountTooHigh"
            ? i18n.t(key, ["max": NSDecimalNumber(decimal: cap).stringValue])
            : i18n.t(key)
    }
}
