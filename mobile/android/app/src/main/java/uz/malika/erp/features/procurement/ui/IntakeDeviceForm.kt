package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.semantics.Role
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.lib.imeiSlotsFilled
import uz.malika.erp.features.procurement.lib.isValidImei
import uz.malika.erp.features.procurement.lib.validateIntake
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.rememberHaptics
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.shared.ui.ScanConfirmSheet
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.ui.theme.Tokens

/**
 * The scanning station (hero of the intake sheet) plus the batch defaults below
 * it. A scan only FILLS the next empty IMEI slot (IMEI 1, then IMEI 2 when Dual
 * SIM is on), checking length alone. Once every required slot is filled and
 * model + cost are set, the unit stages: a HID/typed scan (or completing the
 * batch defaults) calls [onAdd] directly and clears the IMEI slots for the next
 * unit; only a camera read opens a [ScanConfirmSheet] first, so a mis-read can be
 * rejected before it is added. A missing model/cost/spec shows an inline hint in
 * the batch-defaults block under the field it names — never an error under the
 * scanner — so the operator is not told "select model" while scanning.
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
    // The i18n KEY of the field that blocked staging; routed to its field below.
    var hintKey by remember { mutableStateOf<String?>(null) }
    var pending by remember { mutableStateOf<IntakeDraft?>(null) }
    // Bumped after a unit is added to remount the scanners → clears + refocuses IMEI 1.
    var resetKey by remember { mutableIntStateOf(0) }
    val haptics = rememberHaptics()

    fun commit(draft: IntakeDraft) {
        onAdd(draft)
        imei1 = ""; imei2 = ""
        slot1Error = null; slot2Error = null; hintKey = null
        resetKey++
    }

    fun stageIfComplete(fromCamera: Boolean) {
        if (!imeiSlotsFilled(imei1, imei2, dualSim)) return
        val m = model ?: run { hintKey = "shipments.selectModel"; return }
        val costNum = cost.trim().toDoubleOrNull()
        if (costNum == null || costNum < 0) { hintKey = "shipments.acquisitionCost"; return }
        val second = if (dualSim) imei2.trim() else null
        val key = validateIntake(imei1.trim(), true, costNum, m.attributes, specs, second, dualSim)
        if (key != null) {
            if (key == "inventory.imei2Mismatch") slot2Error = t(key, null) else hintKey = key
            return
        }
        hintKey = null
        val draft = IntakeDraft(imei1.trim(), m.id, specs.toMap(), costNum, target.trim().toDoubleOrNull(), second)
        // Camera reads are confirmed first; a wedge/typed scan stages straight away.
        if (fromCamera) pending = draft else commit(draft)
    }

    fun fillNextSlot(raw: String, fromCamera: Boolean) {
        if (pending != null) return // ignore scans while the confirm sheet is open
        val code = raw.trim()
        val fillingSecond = imei1.isNotBlank() && dualSim && imei2.isBlank()
        if (!isValidImei(code)) {
            val msg = t("shipments.imeiLength", null)
            if (fillingSecond) slot2Error = msg else slot1Error = msg
            haptics.error() // rejected scan: bad IMEI length
            return
        }
        when {
            imei1.isBlank() -> { imei1 = code; slot1Error = null }
            dualSim && imei2.isBlank() -> { imei2 = code; slot2Error = null }
            // No empty slot (both filled after a cancel) → restart the pair.
            else -> { imei1 = code; imei2 = ""; slot1Error = null; slot2Error = null }
        }
        stageIfComplete(fromCamera)
    }

    Column(modifier) {
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
        Spacer(Modifier.height(Tokens.Space.section))
        IntakeBatchDefaults(
            models = models,
            model = model,
            onModelSelect = { model = it; specs.clear(); stageIfComplete(false) },
            specs = specs,
            onSpecChange = { k, v -> specs[k] = v; stageIfComplete(false) },
            cost = cost,
            onCostChange = { cost = it; stageIfComplete(false) },
            target = target,
            onTargetChange = { target = it },
            hintKey = hintKey,
        )
    }

    pending?.let { d ->
        ScanConfirmSheet(
            code = d.imei,
            confirmLabel = t("shipments.addDevice", null),
            cancelLabel = t("common.cancel", null),
            closeLabel = t("common.close", null),
            onConfirm = { commit(d); pending = null },
            onDismiss = { pending = null }, // cancel keeps the filled slots so they can be fixed
            title = models.firstOrNull { it.id == d.modelId }?.label,
            price = d.acquisitionCost.toString(),
            subtitle = d.imei2?.takeIf { it.isNotBlank() }?.let { "${t("inventory.imei2", null)}: $it" },
        )
    }
}

/**
 * IMEI 1 heading with the Dual SIM toggle on the right. The label + switch are a
 * single `toggleable` target with `Role.Switch`, so TalkBack announces one
 * named switch (the "Dual SIM" label) instead of an unlabeled control.
 */
@Composable
private fun ImeiSlotLabel(
    label: String,
    dualSim: Boolean,
    dualLabel: String,
    onDualChange: (Boolean) -> Unit,
) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
        Row(
            modifier = Modifier.toggleable(value = dualSim, onValueChange = onDualChange, role = Role.Switch),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(dualLabel, style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.width(Tokens.Space.gap))
            AppSwitch(checked = dualSim, onCheckedChange = null)
        }
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
