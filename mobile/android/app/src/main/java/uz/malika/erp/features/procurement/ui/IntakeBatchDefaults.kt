package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.procurement.data.AttributeDefDto
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AdaptiveInputs
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.Tokens

/**
 * Batch defaults for the intake loop — model, spec fields, acquisition cost and
 * target price — grouped under one [AppCard] headed `shipments.specs`. These
 * persist across the batch (the scan station resets per unit). Once model AND a
 * valid cost are set the block collapses to a one-line summary (model · cost ·
 * specs) with a chevron to reopen it; it stays open while either is missing.
 * [hintKey] is the i18n key of the field that blocked the last stage attempt; it
 * renders directly under the field it names, so the operator is never told
 * "select model" under the scanner.
 */
@Composable
fun IntakeBatchDefaults(
    models: List<DeviceModelDto>,
    model: DeviceModelDto?,
    onModelSelect: (DeviceModelDto?) -> Unit,
    specs: Map<String, String>,
    onSpecChange: (String, String) -> Unit,
    cost: String,
    onCostChange: (String) -> Unit,
    target: String,
    onTargetChange: (String) -> Unit,
    hintKey: String?,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val complete = model != null && (cost.trim().toDoubleOrNull()?.let { it >= 0 } == true)
    var manualExpanded by remember { mutableStateOf<Boolean?>(null) }
    val expanded = manualExpanded ?: !complete

    AppCard(modifier) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                t("shipments.specs", null),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            IconButton(onClick = { manualExpanded = !expanded }) {
                Icon(
                    if (expanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                    contentDescription = t("shipments.specs", null),
                )
            }
        }
        if (expanded) {
            Fields(models, model, onModelSelect, specs, onSpecChange, cost, onCostChange, target, onTargetChange, hintKey)
        } else {
            Summary(model, cost, specs)
        }
    }
}

@Composable
private fun Fields(
    models: List<DeviceModelDto>,
    model: DeviceModelDto?,
    onModelSelect: (DeviceModelDto?) -> Unit,
    specs: Map<String, String>,
    onSpecChange: (String, String) -> Unit,
    cost: String,
    onCostChange: (String) -> Unit,
    target: String,
    onTargetChange: (String) -> Unit,
    hintKey: String?,
) {
    val t = LocalT.current
    Spacer(Modifier.height(Tokens.Space.section))
    AppSelect(
        label = t("shipments.selectModel", null),
        value = model,
        options = models,
        optionLabel = { it.label },
        onSelect = onModelSelect,
    )
    FieldHint(hintKey, "shipments.selectModel")
    model?.attributes?.forEach { attr ->
        Spacer(Modifier.height(Tokens.Space.section))
        SpecField(attr, specs[attr.key] ?: "") { onSpecChange(attr.key, it) }
    }
    FieldHint(hintKey, "shipments.invalidSpecs")
    Spacer(Modifier.height(Tokens.Space.section))
    AdaptiveInputs(
        fields = listOf(
            { m ->
                AppFormField(
                    t("shipments.acquisitionCost", null), cost, onCostChange,
                    keyboardType = KeyboardType.Decimal, modifier = m,
                )
            },
            { m ->
                AppFormField(
                    t("shipments.targetPrice", null), target, onTargetChange,
                    keyboardType = KeyboardType.Decimal, modifier = m,
                )
            },
        ),
        spacing = Tokens.Space.section,
    )
    FieldHint(hintKey, "shipments.acquisitionCost")
}

@Composable
private fun Summary(model: DeviceModelDto?, cost: String, specs: Map<String, String>) {
    val t = LocalT.current
    Spacer(Modifier.height(Tokens.Space.rowV))
    Row(
        Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap),
    ) {
        Text(model?.label ?: t("shipments.selectModel", null), style = MaterialTheme.typography.bodyMedium)
        Text("·", style = MaterialTheme.typography.bodyMedium, color = Tokens.slate)
        MoneyText(cost, style = MaterialTheme.typography.bodyMedium)
        if (specs.values.any { it.isNotBlank() }) {
            Text("·", style = MaterialTheme.typography.bodyMedium, color = Tokens.slate)
            Text(
                specs.values.filter { it.isNotBlank() }.joinToString(" · "),
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.slate,
            )
        }
    }
}

/** The staged-blocker hint, shown only under the field whose key matches [self]. */
@Composable
private fun FieldHint(hintKey: String?, self: String) {
    if (hintKey != self) return
    val t = LocalT.current
    Spacer(Modifier.height(Tokens.Space.rowV))
    Text(t(hintKey, null), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
}

/** One spec input, chosen by attribute type (select → dropdown, else text). */
@Composable
private fun SpecField(attr: AttributeDefDto, value: String, onChange: (String) -> Unit) {
    val label = if (attr.required) "${attr.label} *" else attr.label
    if (attr.type == "select" && attr.options.isNotEmpty()) {
        AppSelect(
            label = label,
            value = attr.options.firstOrNull { it == value },
            options = attr.options,
            optionLabel = { it },
            onSelect = { it?.let(onChange) },
        )
    } else {
        AppFormField(
            label = label,
            value = value,
            onValueChange = onChange,
            keyboardType = if (attr.type == "number") KeyboardType.Number else KeyboardType.Text,
        )
    }
}
