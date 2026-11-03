import SwiftUI

/// Store settings form: identity, sales, Nasiya and Telegram sections. Mirrors
/// the web Settings page. Stock `Form`/`TextField`/`Picker` so iOS chrome and
/// Dark Mode come for free; the save action is online-only and blocks offline.
struct SettingsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = SettingsModel()

    var body: some View {
        content
            .navigationTitle(i18n.t("settings.title"))
            .navigationBarTitleDisplayMode(.inline)
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
        Form {
            identity
            sales
            nasiya
            telegram
            footer
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private var identity: some View {
        Section(i18n.t("settings.sectionIdentity")) {
            labeled("settings.storeName", $model.form.storeName)
            labeled("settings.storePhone", $model.form.storePhone, keyboard: .phonePad)
            labeled("settings.storeAddress", $model.form.storeAddress)
            labeled("settings.receiptFooter", $model.form.receiptFooter)
        }
    }

    private var sales: some View {
        Section(i18n.t("settings.sectionSales")) {
            number("settings.defaultWarrantyDays", $model.form.defaultWarrantyDays, "defaultWarrantyDays")
            number("settings.minMarginPercent", $model.form.minMarginPercent, "minMarginPercent", decimal: true)
            number("settings.lowStockThreshold", $model.form.lowStockThreshold, "lowStockThreshold")
            LabeledContent(i18n.t("settings.currency"), value: "USD")
        }
    }

    private var nasiya: some View {
        Section(i18n.t("settings.sectionNasiya")) {
            number("settings.defaultNasiyaDueDays", $model.form.defaultNasiyaDueDays, "defaultNasiyaDueDays")
            number("settings.overdueReminderDays", $model.form.overdueReminderDays, "overdueReminderDays")
        }
    }

    private var telegram: some View {
        Section(i18n.t("settings.sectionTelegram")) {
            labeled("settings.telegramChatId", $model.form.telegramChatId, mono: true)
            number("settings.closingTime", $model.form.closingTime, "closingTime", placeholder: "HH:mm")
        }
    }

    @ViewBuilder private var footer: some View {
        Section {
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                Task { await model.save() }
            } label: {
                HStack(spacing: 8) {
                    if model.saving {
                        ProgressView().tint(Color(.systemBackground))
                    }
                    Text(model.saving ? i18n.t("settings.saving") : i18n.t("common.save"))
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
            }
            .buttonStyle(.borderedProminent)
            .tint(Tokens.ink)
            .disabled(model.saving || !model.isDirty || !model.invalidFields.isEmpty)
            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
            .listRowBackground(Color.clear)

            if model.saved {
                Label(i18n.t("settings.settingsSaved"), systemImage: "checkmark.circle.fill")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Tokens.success)
            }
            if let err = model.saveError {
                Label(err, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote)
                    .foregroundStyle(Tokens.danger)
            }
        } footer: {
            if !model.updatedAt.isEmpty {
                Text("\(i18n.t("settings.lastUpdated")): \(model.updatedAt)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: field builders that carry their own validation key

    private func labeled(_ key: String, _ binding: Binding<String>,
                         keyboard: UIKeyboardType = .default, mono: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(i18n.t(key)).font(.caption).foregroundStyle(.secondary)
            TextField(i18n.t(key), text: binding)
                .keyboardType(keyboard)
                .font(mono ? .mono(16) : .body)
                .autocorrectionDisabled(mono)
                .textInputAutocapitalization(mono ? .never : .sentences)
        }
    }

    private func number(_ key: String, _ binding: Binding<String>, _ validationKey: String,
                        decimal: Bool = false, placeholder: String = "") -> some View {
        let invalid = model.invalidFields.contains(validationKey)
        let isTime = validationKey == "closingTime"
        return VStack(alignment: .leading, spacing: 2) {
            Text(i18n.t(key)).font(.caption).foregroundStyle(.secondary)
            TextField(placeholder, text: binding)
                .keyboardType(isTime ? .numbersAndPunctuation : (decimal ? .decimalPad : .numberPad))
                .font(.mono(16))
            if invalid {
                Text(i18n.t("common.required", default: "Invalid value"))
                    .font(.caption2).foregroundStyle(Tokens.danger)
            }
        }
        .modifier(SettingFieldSanitizer(binding: binding, decimal: decimal, isTime: isTime))
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
