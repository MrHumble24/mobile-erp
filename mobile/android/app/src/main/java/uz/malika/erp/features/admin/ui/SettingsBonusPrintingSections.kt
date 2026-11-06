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
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.admin.model.SettingsErrors
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens
import androidx.compose.foundation.layout.fillMaxWidth

/** Bonus points + receipt/price-tag printing switches (ADR 0043). Always visible in settings. */

@Composable
fun BonusSettingsSection(form: SettingsFormState, errors: SettingsErrors) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        Text(t("settings.sectionBonus", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Text(t("settings.sectionBonusDesc", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))
        Column {
            ToggleRow(t("settings.bonusEnabled", null), form.bonusEnabled) { form.bonusEnabled = it }
            if (form.bonusEnabled) {
                Spacer(Modifier.height(Tokens.Space.md))
                NumField(t("settings.bonusEarnPercent", null), form.bonusEarnPercent, { form.bonusEarnPercent = it }, errors.bonusEarnPercent, decimal = true)
                Spacer(Modifier.height(Tokens.Space.md))
                NumField(t("settings.bonusMaxRedeemPercent", null), form.bonusMaxRedeemPercent, { form.bonusMaxRedeemPercent = it }, errors.bonusMaxRedeemPercent, decimal = true)
            }
        }
    }
}

@Composable
fun PrintingSettingsSection(form: SettingsFormState) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        Text(t("settings.sectionPrinting", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Text(t("settings.sectionPrintingDesc", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))
        Column {
            ToggleRow(t("settings.receiptPrintingEnabled", null), form.receiptPrintingEnabled) { form.receiptPrintingEnabled = it }
            if (form.receiptPrintingEnabled) {
                Spacer(Modifier.height(Tokens.Space.md))
                Text(t("settings.receiptPaperWidth", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
                Spacer(Modifier.height(6.dp))
                val width = form.receiptPaperWidthMm.toIntOrNull() ?: 80
                SegmentedControl(
                    options = listOf(
                        SegmentOption(58, t("settings.paperWidth58", null)),
                        SegmentOption(80, t("settings.paperWidth80", null)),
                    ),
                    selected = width,
                    onSelect = { form.receiptPaperWidthMm = it.toString() },
                )
            }
            Spacer(Modifier.height(Tokens.Space.md))
            ToggleRow(t("settings.priceTagsEnabled", null), form.priceTagsEnabled) { form.priceTagsEnabled = it }
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
    AppFormField(
        label = label,
        value = value,
        onValueChange = onChange,
        keyboardType = if (decimal) KeyboardType.Decimal else KeyboardType.Number,
        error = if (invalid) LocalT.current("common.required", null) else null,
    )
}
