package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.admin.model.SettingsErrors
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.ui.theme.Tokens
import androidx.compose.foundation.layout.fillMaxWidth
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.ui.theme.MonoFamily

/** The four store-settings field groups (identity / sales / nasiya / telegram). */

@Composable
private fun SectionCard(title: String, description: String, content: @Composable () -> Unit) {
    AppCard(Modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Text(description, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))
        content()
    }
}

@Composable
fun StoreIdentitySection(form: SettingsFormState) {
    val t = LocalT.current
    SectionCard(t("settings.sectionIdentity", null), t("settings.sectionIdentityDesc", null)) {
        Column {
            AppFormField(t("settings.storeName", null), form.storeName, { form.storeName = it })
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(t("settings.storePhone", null), form.storePhone, { form.storePhone = it }, keyboardType = KeyboardType.Phone)
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(t("settings.storeAddress", null), form.storeAddress, { form.storeAddress = it })
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(t("settings.receiptFooter", null), form.receiptFooter, { form.receiptFooter = it })
        }
    }
}

@Composable
fun SalesSection(form: SettingsFormState, errors: SettingsErrors) {
    val t = LocalT.current
    SectionCard(t("settings.sectionSales", null), t("settings.sectionSalesDesc", null)) {
        Column {
            NumField(t("settings.defaultWarrantyDays", null), form.defaultWarrantyDays, { form.defaultWarrantyDays = it }, errors.defaultWarrantyDays)
            Spacer(Modifier.height(Tokens.Space.md))
            NumField(t("settings.minMarginPercent", null), form.minMarginPercent, { form.minMarginPercent = it }, errors.minMarginPercent, decimal = true)
            Spacer(Modifier.height(Tokens.Space.md))
            NumField(t("settings.lowStockThreshold", null), form.lowStockThreshold, { form.lowStockThreshold = it }, errors.lowStockThreshold)
            Spacer(Modifier.height(Tokens.Space.md))
            FactRow(t("settings.currency", null), last = true) {
                Text("USD", style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
            }
            Text(t("settings.currencyFixed", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
    }
}

@Composable
fun NasiyaSection(form: SettingsFormState, errors: SettingsErrors) {
    val t = LocalT.current
    SectionCard(t("settings.sectionNasiya", null), t("settings.sectionNasiyaDesc", null)) {
        Column {
            NumField(t("settings.defaultNasiyaDueDays", null), form.defaultNasiyaDueDays, { form.defaultNasiyaDueDays = it }, errors.defaultNasiyaDueDays)
            Spacer(Modifier.height(Tokens.Space.md))
            NumField(t("settings.overdueReminderDays", null), form.overdueReminderDays, { form.overdueReminderDays = it }, errors.overdueReminderDays)
        }
    }
}

@Composable
fun TelegramSection(form: SettingsFormState, errors: SettingsErrors) {
    val t = LocalT.current
    SectionCard(t("settings.sectionTelegram", null), t("settings.sectionTelegramDesc", null)) {
        Column {
            AppFormField(t("settings.telegramChatId", null), form.telegramChatId, { form.telegramChatId = it }, placeholder = "-1001234567890")
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(
                t("settings.closingTime", null), form.closingTime, { form.closingTime = it },
                placeholder = "20:00",
                error = if (errors.closingTime) t("common.required", null) else null,
            )
        }
    }
}

/** Discounts (Change 7/12, ADR 0034): off by default; reveals its options when on. */
@Composable
fun DiscountsSection(form: SettingsFormState) {
    val t = LocalT.current
    SectionCard(t("pricing.settingsTitle", null), t("pricing.settingsEnabled", null)) {
        Column {
            ToggleRow(t("pricing.settingsEnabled", null), form.discountsEnabled) { form.discountsEnabled = it }
            if (form.discountsEnabled) {
                Spacer(Modifier.height(Tokens.Space.sm))
                ToggleRow(t("pricing.settingsPercent", null), form.discountPercentAllowed) { form.discountPercentAllowed = it }
                Spacer(Modifier.height(Tokens.Space.sm))
                ToggleRow(t("pricing.settingsAmount", null), form.discountAmountAllowed) { form.discountAmountAllowed = it }
                Spacer(Modifier.height(Tokens.Space.md))
                NumField(t("pricing.settingsMax", null), form.maxDiscountPercent, { form.maxDiscountPercent = it }, invalid = false, decimal = true)
                Spacer(Modifier.height(Tokens.Space.md))
                AppFormField(t("pricing.settingsPresetsPercent", null), form.discountPresetsPercent, { form.discountPresetsPercent = it }, placeholder = t("pricing.settingsPresetsHint", null))
                Spacer(Modifier.height(Tokens.Space.md))
                AppFormField(t("pricing.settingsPresetsAmount", null), form.discountPresetsAmount, { form.discountPresetsAmount = it }, placeholder = t("pricing.settingsPresetsHint", null))
            }
        }
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
        AppSwitch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun NumField(label: String, value: String, onChange: (String) -> Unit, invalid: Boolean, decimal: Boolean = false) {
    val t = LocalT.current
    AppFormField(
        label = label,
        value = value,
        onValueChange = onChange,
        keyboardType = if (decimal) KeyboardType.Decimal else KeyboardType.Number,
        error = if (invalid) t("common.required", null) else null,
    )
}
