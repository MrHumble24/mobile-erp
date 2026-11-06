import SwiftUI

/// Bonus points section in store settings (ADR 0043).
struct SettingsBonusSection: View {
    @Environment(I18n.self) private var i18n
    @Bindable var model: SettingsModel

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(i18n.t("settings.sectionBonus")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                    Text(i18n.t("settings.sectionBonusDesc")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Toggle(i18n.t("settings.bonusEnabled"), isOn: $model.form.bonusEnabled)
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                if model.form.bonusEnabled {
                    AppFormField(label: i18n.t("settings.bonusEarnPercent")) {
                        AppTextField(
                            placeholder: "0",
                            text: $model.form.bonusEarnPercent,
                            keyboard: .decimalPad,
                            font: .mono(15, weight: .medium)
                        )
                        .sanitizeDecimal($model.form.bonusEarnPercent)
                        if model.invalidFields.contains("bonusEarnPercent") {
                            FormErrorLine(message: i18n.t("common.required"))
                        }
                    }
                    AppFormField(label: i18n.t("settings.bonusMaxRedeemPercent")) {
                        AppTextField(
                            placeholder: "0",
                            text: $model.form.bonusMaxRedeemPercent,
                            keyboard: .decimalPad,
                            font: .mono(15, weight: .medium)
                        )
                        .sanitizeDecimal($model.form.bonusMaxRedeemPercent)
                        if model.invalidFields.contains("bonusMaxRedeemPercent") {
                            FormErrorLine(message: i18n.t("common.required"))
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Printing preferences section in store settings (ADR 0043): receipt toggle, width (58/80 mm), price tags toggle.
struct SettingsPrintingSection: View {
    @Environment(I18n.self) private var i18n
    @Bindable var model: SettingsModel

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(i18n.t("settings.sectionPrinting")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                    Text(i18n.t("settings.sectionPrintingDesc")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Toggle(i18n.t("settings.receiptPrintingEnabled"), isOn: $model.form.receiptPrintingEnabled)
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                if model.form.receiptPrintingEnabled {
                    VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                        Text(i18n.t("settings.receiptPaperWidth"))
                            .font(.ui(.caption))
                            .foregroundStyle(Tokens.muted)
                        Picker(i18n.t("settings.receiptPaperWidth"), selection: $model.form.receiptPaperWidthMm) {
                            Text(i18n.t("settings.paperWidth58")).tag(58)
                            Text(i18n.t("settings.paperWidth80")).tag(80)
                        }
                        .pickerStyle(.segmented)
                    }
                }
                Toggle(i18n.t("settings.priceTagsEnabled"), isOn: $model.form.priceTagsEnabled)
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
