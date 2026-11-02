package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.admin.model.SettingsErrors
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.ui.theme.Tokens

/** The four store-settings field groups (identity / sales / nasiya / telegram). */

@Composable
private fun SectionCard(title: String, description: String, content: @Composable () -> Unit) {
    AppCard {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(description, style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
        Spacer(Modifier.height(12.dp))
        content()
    }
}

@Composable
fun StoreIdentitySection(form: SettingsFormState) {
    val t = LocalT.current
    SectionCard(t("settings.sectionIdentity", null), t("settings.sectionIdentityDesc", null)) {
        Column {
            AppFormField(t("settings.storeName", null), form.storeName, { form.storeName = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(t("settings.storePhone", null), form.storePhone, { form.storePhone = it }, keyboardType = KeyboardType.Phone)
            Spacer(Modifier.height(12.dp))
            AppFormField(t("settings.storeAddress", null), form.storeAddress, { form.storeAddress = it })
            Spacer(Modifier.height(12.dp))
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
            Spacer(Modifier.height(12.dp))
            NumField(t("settings.minMarginPercent", null), form.minMarginPercent, { form.minMarginPercent = it }, errors.minMarginPercent, decimal = true)
            Spacer(Modifier.height(12.dp))
            NumField(t("settings.lowStockThreshold", null), form.lowStockThreshold, { form.lowStockThreshold = it }, errors.lowStockThreshold)
        }
    }
}

@Composable
fun NasiyaSection(form: SettingsFormState, errors: SettingsErrors) {
    val t = LocalT.current
    SectionCard(t("settings.sectionNasiya", null), t("settings.sectionNasiyaDesc", null)) {
        Column {
            NumField(t("settings.defaultNasiyaDueDays", null), form.defaultNasiyaDueDays, { form.defaultNasiyaDueDays = it }, errors.defaultNasiyaDueDays)
            Spacer(Modifier.height(12.dp))
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
            Spacer(Modifier.height(12.dp))
            AppFormField(
                t("settings.closingTime", null), form.closingTime, { form.closingTime = it },
                placeholder = "20:00",
                error = if (errors.closingTime) t("common.required", null) else null,
            )
        }
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
