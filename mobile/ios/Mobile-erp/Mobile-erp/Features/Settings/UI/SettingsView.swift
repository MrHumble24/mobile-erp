import SwiftUI

/// Store settings as four Warm Card section cards (identity, sales, Nasiya,
/// Telegram) with kit fields, one primary save and the last-updated caption.
/// Mirrors the web Settings page; the save is online-only and blocks offline.
/// Title is the tab label (`nav.settings`), the same string as Android.
struct SettingsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = SettingsModel()

    var body: some View {
        content
            .background(Tokens.ground)
            .navigationTitle(i18n.t("nav.settings"))
            .task {
                model.bind(container)
                if model.loading { await model.load() }
            }
    }

    @ViewBuilder private var content: some View {
        if model.loading {
            LoadingView()
        } else if let error = model.loadError {
            ErrorStateView(message: error.message) { Task { await model.load() } }
        } else {
            form
        }
    }

    private var form: some View {
        @Bindable var model = model
        return ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if !container.connectivity.isOnline { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                section("settings.sectionIdentity", "settings.sectionIdentityDesc") {
                    field("settings.storeName", $model.form.storeName)
                    AppFormField(label: i18n.t("settings.storePhone")) {
                        AppTextField(placeholder: i18n.t("settings.storePhone"), text: $model.form.storePhone, keyboard: .phonePad,
                                     autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                            .sanitizePhone($model.form.storePhone)
                    }
                    field("settings.storeAddress", $model.form.storeAddress)
                    field("settings.receiptFooter", $model.form.receiptFooter)
                }
                section("settings.sectionSales", "settings.sectionSalesDesc") {
                    number("settings.defaultWarrantyDays", $model.form.defaultWarrantyDays, "defaultWarrantyDays")
                    number("settings.minMarginPercent", $model.form.minMarginPercent, "minMarginPercent", decimal: true)
                    number("settings.lowStockThreshold", $model.form.lowStockThreshold, "lowStockThreshold")
                    FactRow(label: i18n.t("settings.currency"), last: true) { Text("USD").font(.data(.regular)) }
                    Text(i18n.t("settings.currencyFixed")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                section("settings.sectionNasiya", "settings.sectionNasiyaDesc") {
                    number("settings.defaultNasiyaDueDays", $model.form.defaultNasiyaDueDays, "defaultNasiyaDueDays")
                    number("settings.overdueReminderDays", $model.form.overdueReminderDays, "overdueReminderDays")
                }
                section("settings.sectionTelegram", "settings.sectionTelegramDesc") {
                    AppFormField(label: i18n.t("settings.telegramChatId")) {
                        AppTextField(placeholder: "-1001234567890", text: $model.form.telegramChatId,
                                     autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                    }
                    number("settings.closingTime", $model.form.closingTime, "closingTime", placeholder: "20:00")
                }
                discountsSection($model)
                if model.saved { FormErrorLine(message: i18n.t("settings.settingsSaved"), color: Tokens.success) }
                if let err = model.saveError { FormErrorLine(message: err) }
                Button {
                    Haptic.tick.play()
                    Task { await model.save() }
                } label: {
                    if model.saving { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("common.save")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(model.saving || !model.isDirty || !model.invalidFields.isEmpty)
                if !model.updatedAt.isEmpty {
                    Text("\(i18n.t("settings.lastUpdated")): \(model.updatedAt)").font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.md)
        }
        .scrollDismissesKeyboard(.interactively)
        .modifier(SettingsDebugAnchor())
    }

    /// Discounts (ADR 0034): the six discount settings in one card.
    private func discountsSection(_ model: Bindable<SettingsModel>) -> some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("pricing.settingsTitle")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                Toggle(i18n.t("pricing.settingsEnabled"), isOn: model.form.discountsEnabled)
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                if model.wrappedValue.form.discountsEnabled {
                    Toggle(i18n.t("pricing.settingsPercent"), isOn: model.form.discountPercentAllowed)
                        .font(.ui(.body)).foregroundStyle(Tokens.text)
                    Toggle(i18n.t("pricing.settingsAmount"), isOn: model.form.discountAmountAllowed)
                        .font(.ui(.body)).foregroundStyle(Tokens.text)
                    AppFormField(label: i18n.t("pricing.settingsPresetsPercent")) {
                        AppTextField(placeholder: "5, 10, 15", text: model.form.discountPresetsPercent,
                                     keyboard: .numbersAndPunctuation, font: .data(.regular))
                    }
                    AppFormField(label: i18n.t("pricing.settingsPresetsAmount")) {
                        AppTextField(placeholder: "50000, 100000", text: model.form.discountPresetsAmount,
                                     keyboard: .numbersAndPunctuation, font: .data(.regular))
                        Text(i18n.t("pricing.settingsPresetsHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    AppFormField(label: i18n.t("pricing.settingsMax")) {
                        AppTextField(placeholder: "0", text: model.form.maxDiscountPercent,
                                     keyboard: .decimalPad, font: .mono(15, weight: .medium))
                            .sanitizeDecimal(model.form.maxDiscountPercent)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// One section card: heading + description, then the fields.
    private func section<Content: View>(_ titleKey: String, _ descKey: String, @ViewBuilder content: () -> Content) -> some View {
        let body = content()
        return AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(i18n.t(titleKey)).font(.ui(.heading)).foregroundStyle(Tokens.text)
                    Text(i18n.t(descKey)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                body
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func field(_ key: String, _ binding: Binding<String>) -> some View {
        AppFormField(label: i18n.t(key)) { AppTextField(placeholder: i18n.t(key), text: binding) }
    }

    @ViewBuilder
    private func number(_ key: String, _ binding: Binding<String>, _ validationKey: String,
                        decimal: Bool = false, placeholder: String = "0") -> some View {
        let invalid = model.invalidFields.contains(validationKey)
        let isTime = validationKey == "closingTime"
        AppFormField(label: i18n.t(key)) {
            AppTextField(placeholder: placeholder, text: binding,
                         keyboard: isTime ? .numbersAndPunctuation : (decimal ? .decimalPad : .numberPad),
                         autocapitalization: .never, disableAutocorrection: true, font: .data(.regular))
                .modifier(SettingFieldSanitizer(binding: binding, decimal: decimal, isTime: isTime))
            if invalid { FormErrorLine(message: i18n.t("common.required")) }
        }
    }
}

/// Screenshot helper: `-settingsBottom 1` anchors the scroll at the bottom so
/// the Discounts section is captured.
private struct SettingsDebugAnchor: ViewModifier {
    func body(content: Content) -> some View {
        #if DEBUG
        if UserDefaults.standard.string(forKey: "settingsBottom") == "1" {
            content.defaultScrollAnchor(.bottom)
        } else { content }
        #else
        content
        #endif
    }
}

private struct SettingFieldSanitizer: ViewModifier {
    @Binding var binding: String
    let decimal: Bool
    let isTime: Bool

    func body(content: Content) -> some View {
        if isTime {
            content
        } else if decimal {
            content.sanitizeDecimal($binding)
        } else {
            content.sanitizeDigits($binding)
        }
    }
}
