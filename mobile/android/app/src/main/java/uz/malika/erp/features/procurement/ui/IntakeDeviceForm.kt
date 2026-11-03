package uz.malika.erp.features.procurement.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.ui.theme.Tokens
import uz.malika.erp.features.procurement.data.AttributeDefDto
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.lib.imeiSlotsFilled
import uz.malika.erp.features.procurement.lib.isValidImei
import uz.malika.erp.features.procurement.lib.validateIntake
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AdaptiveInputs
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ScanConfirmSheet
import uz.malika.erp.shared.ui.ScannerField

/**
 * Sticky model + specs + cost, with one or two [ScannerField]s. A scan never
 * submits a unit: it only FILLS the next empty IMEI slot (IMEI 1, then IMEI 2
 * when Dual SIM is on), checking length alone. Once every required slot is
 * filled and model + cost are set, a [ScanConfirmSheet] opens so a mis-read can
 * be rejected; confirm calls [onAdd] and clears the IMEI slots for the next unit
 * while keeping the batch defaults (Dual SIM / model / cost). A missing model or
 * cost shows an inline hint instead of an error — the user is never told "IMEI 2
 * required" while scanning IMEI 1.
 */
@Composable
fun IntakeDeviceForm(
    models: List<DeviceModelDto>,
    onAdd: (IntakeDraft) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    var model by remember { mutableStateOf<DeviceModelDto?>(null) }
    val specs = remember { mutableStateMapOf<String, String>() }
    var cost by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("") }
    // Toggle + model + cost persist across the batch; the IMEI slots reset per unit.
    var dualSim by remember { mutableStateOf(false) }
    var imei1 by remember { mutableStateOf("") }
    var imei2 by remember { mutableStateOf("") }
    var slot1Error by remember { mutableStateOf<String?>(null) }
    var slot2Error by remember { mutableStateOf<String?>(null) }
    var hint by remember { mutableStateOf<String?>(null) }
    var pending by remember { mutableStateOf<IntakeDraft?>(null) }
    // Bumped on confirm to remount the scanners → clears + refocuses IMEI 1.
    var resetKey by remember { mutableIntStateOf(0) }

    fun stageIfComplete() {
        if (!imeiSlotsFilled(imei1, imei2, dualSim)) return
        val m = model ?: run { hint = t("shipments.selectModel", null); return }
        val costNum = cost.trim().toDoubleOrNull()
        if (costNum == null || costNum < 0) { hint = t("shipments.acquisitionCost", null); return }
        val second = if (dualSim) imei2.trim() else null
        val key = validateIntake(imei1.trim(), true, costNum, m.attributes, specs, second, dualSim)
        if (key != null) {
            if (key == "inventory.imei2Mismatch") slot2Error = t(key, null) else hint = t(key, null)
            return
        }
        hint = null
        pending = IntakeDraft(imei1.trim(), m.id, specs.toMap(), costNum, target.trim().toDoubleOrNull(), second)
    }

    fun fillNextSlot(raw: String) {
        if (pending != null) return // ignore scans while the confirm sheet is open
        val code = raw.trim()
        val fillingSecond = imei1.isNotBlank() && dualSim && imei2.isBlank()
        if (!isValidImei(code)) {
            val msg = t("shipments.imeiLength", null)
            if (fillingSecond) slot2Error = msg else slot1Error = msg
            return
        }
        when {
            imei1.isBlank() -> { imei1 = code; slot1Error = null }
            dualSim && imei2.isBlank() -> { imei2 = code; slot2Error = null }
            // No empty slot (both filled after a cancel) → restart the pair.
            else -> { imei1 = code; imei2 = ""; slot1Error = null; slot2Error = null }
        }
        stageIfComplete()
    }

    fun confirm() {
        pending?.let(onAdd)
        pending = null
        imei1 = ""; imei2 = ""
        slot1Error = null; slot2Error = null; hint = null
        resetKey++
    }

    Column(modifier) {
        AppSelect(
            label = t("shipments.selectModel", null),
            value = model,
            options = models,
            optionLabel = { it.label },
            onSelect = { model = it; specs.clear(); stageIfComplete() },
        )
        model?.attributes?.forEach { attr ->
            Spacer(Modifier.height(Tokens.Space.section))
            SpecField(attr, specs[attr.key] ?: "") { specs[attr.key] = it }
        }
        Spacer(Modifier.height(Tokens.Space.section))
        AdaptiveInputs(
            fields = listOf(
                { m ->
                    AppFormField(
                        t("shipments.acquisitionCost", null), cost, { cost = it; stageIfComplete() },
                        keyboardType = KeyboardType.Decimal, modifier = m,
                    )
                },
                { m ->
                    AppFormField(
                        t("shipments.targetPrice", null), target, { target = it },
                        keyboardType = KeyboardType.Decimal, modifier = m,
                    )
                },
            ),
            spacing = Tokens.Space.section,
        )
        Spacer(Modifier.height(Tokens.Space.section))
        key(resetKey) {
            Column {
                ImeiSlotLabel(
                    label = t("shipments.scanImei", null),
                    dualSim = dualSim,
                    dualLabel = t("inventory.dualSim", null),
                    onDualChange = { dualSim = it; if (!it) { imei2 = ""; slot2Error = null } },
                )
                Spacer(Modifier.height(Tokens.Space.rowV))
                ScannerField(onScan = ::fillNextSlot, placeholder = t("shipments.scanImei", null))
                SlotHint(imei1, slot1Error)
                if (dualSim) {
                    Spacer(Modifier.height(Tokens.Space.section))
                    Text(t("inventory.imei2", null), style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(Tokens.Space.rowV))
                    ScannerField(
                        onScan = ::fillNextSlot,
                        placeholder = t("inventory.imei2Hint", null),
                        autofocus = false,
                    )
                    SlotHint(imei2, slot2Error)
                }
            }
        }
        hint?.let {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
        }
    }

    pending?.let { d ->
        ScanConfirmSheet(
            code = d.imei,
            confirmLabel = t("shipments.addDevice", null),
            cancelLabel = t("common.cancel", null),
            closeLabel = t("common.close", null),
            onConfirm = ::confirm,
            onDismiss = { pending = null }, // cancel keeps the filled slots so they can be fixed
            title = models.firstOrNull { it.id == d.modelId }?.label,
            price = d.acquisitionCost.toString(),
            subtitle = d.imei2?.takeIf { it.isNotBlank() }?.let { "${t("inventory.imei2", null)}: $it" },
        )
    }
}

/** IMEI 1 label row with the Dual SIM switch inline on the right. */
@Composable
private fun ImeiSlotLabel(
    label: String,
    dualSim: Boolean,
    dualLabel: String,
    onDualChange: (Boolean) -> Unit,
) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
        Text(dualLabel, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.width(Tokens.Space.gap))
        Switch(
            checked = dualSim,
            onCheckedChange = onDualChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Tokens.primaryForeground,
                checkedTrackColor = Tokens.primary,
                uncheckedTrackColor = Tokens.border,
            ),
        )
    }
}

/** Captured IMEI (mono) once a slot is filled, or its inline length error. */
@Composable
private fun SlotHint(value: String, error: String?) {
    when {
        error != null -> {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(error, style = MaterialTheme.typography.bodySmall, color = Tokens.destructive)
        }
        value.isNotBlank() -> {
            Spacer(Modifier.height(Tokens.Space.rowV))
            ImeiText(value, style = MaterialTheme.typography.bodySmall)
        }
    }
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
