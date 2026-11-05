package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.lib.LookupFill
import uz.malika.erp.features.procurement.lib.imeiSlotsFilled
import uz.malika.erp.features.procurement.lib.isValidImei
import uz.malika.erp.features.procurement.lib.validateIntake
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.rememberHaptics
import uz.malika.erp.shared.ui.ScanConfirmSheet
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.ui.theme.Tokens

/**
 * The scanning station (hero of the intake sheet) plus the batch defaults below
 * it. The station follows the selected model's kind (ADR 0029): an IMEI model
 * fills IMEI 1 (+ IMEI 2 when Dual SIM is on); a SERIAL model asks for one
 * serial number (no IMEI fields). QUANTITY models are not offered (server 400s).
 * A HID/typed scan stages the unit straight away once model + cost are set; a
 * camera read opens a [ScanConfirmSheet] first so a mis-read can be rejected.
 */
@Composable
fun IntakeDeviceForm(
    models: List<DeviceModelDto>,
    canExpense: Boolean,
    online: Boolean,
    canLearn: Boolean,
    repo: ProcurementRepository,
    onAdd: (IntakeDraft) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val sellable = remember(models) { models.filter { !it.isQuantity } }
    var model by remember { mutableStateOf<DeviceModelDto?>(null) }
    val specs = remember { mutableStateMapOf<String, String>() }
    var cost by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("") }
    var expense by remember { mutableStateOf("") }
    var expenseNote by remember { mutableStateOf("") }
    var dualSim by remember { mutableStateOf(false) }
    var imei1 by remember { mutableStateOf("") }
    var imei2 by remember { mutableStateOf("") }
    var serial by remember { mutableStateOf("") }
    var slot1Error by remember { mutableStateOf<String?>(null) }
    var slot2Error by remember { mutableStateOf<String?>(null) }
    var serialError by remember { mutableStateOf<String?>(null) }
    var hintKey by remember { mutableStateOf<String?>(null) }
    var pending by remember { mutableStateOf<IntakeDraft?>(null) }
    var resetKey by remember { mutableIntStateOf(0) }
    val haptics = rememberHaptics()
    val isSerial = model?.isSerial == true

    fun commit(draft: IntakeDraft) {
        onAdd(draft)
        imei1 = ""; imei2 = ""; serial = ""
        slot1Error = null; slot2Error = null; serialError = null; hintKey = null
        resetKey++
    }

    fun stageIfComplete(fromCamera: Boolean) {
        val m = model ?: run { if (imei1.isNotBlank()) hintKey = "shipments.selectModel"; return }
        val costNum = cost.trim().toDoubleOrNull()
        val draft: IntakeDraft
        if (m.isSerial) {
            if (serial.isBlank()) return
            if (costNum == null || costNum < 0) { hintKey = "shipments.acquisitionCost"; return }
            if (!UnitCode.isValidSerial(serial)) { serialError = t("catalog.errorSerialInvalid", null); return }
            if (m.attributes.any { it.required && specs[it.key].isNullOrBlank() }) { hintKey = "shipments.invalidSpecs"; return }
            hintKey = null
            draft = IntakeDraft(
                serialNumber = UnitCode.normalizeSerial(serial), modelId = m.id, specs = specs.toMap(),
                acquisitionCost = costNum, targetPrice = target.trim().toDoubleOrNull(),
                unitExpense = if (canExpense) expense.trim().toDoubleOrNull() else null,
                unitExpenseNote = if (canExpense) expenseNote.trim().ifBlank { null } else null,
            )
        } else {
            if (!imeiSlotsFilled(imei1, imei2, dualSim)) return
            if (costNum == null || costNum < 0) { hintKey = "shipments.acquisitionCost"; return }
            val second = if (dualSim) imei2.trim() else null
            val key = validateIntake(imei1.trim(), true, costNum, m.attributes, specs, second, dualSim)
            if (key != null) {
                if (key == "inventory.imei2Mismatch") slot2Error = t(key, null) else hintKey = key
                return
            }
            hintKey = null
            draft = IntakeDraft(
                imei = imei1.trim(), modelId = m.id, specs = specs.toMap(), acquisitionCost = costNum,
                targetPrice = target.trim().toDoubleOrNull(), imei2 = second,
                unitExpense = if (canExpense) expense.trim().toDoubleOrNull() else null,
                unitExpenseNote = if (canExpense) expenseNote.trim().ifBlank { null } else null,
            )
        }
        if (fromCamera) pending = draft else commit(draft)
    }

    fun onSerialScan(raw: String, fromCamera: Boolean) {
        if (pending != null) return
        val code = UnitCode.normalizeSerial(raw)
        if (!UnitCode.isValidSerial(code)) {
            serialError = t("catalog.errorSerialInvalid", null); haptics.error(); return
        }
        serial = code; serialError = null
        stageIfComplete(fromCamera)
    }

    fun fillNextSlot(raw: String, fromCamera: Boolean) {
        if (pending != null) return
        val code = raw.trim()
        val fillingSecond = imei1.isNotBlank() && dualSim && imei2.isBlank()
        if (!isValidImei(code)) {
            val msg = t("shipments.imeiLength", null)
            if (fillingSecond) slot2Error = msg else slot1Error = msg
            haptics.error()
            return
        }
        when {
            imei1.isBlank() -> { imei1 = code; slot1Error = null }
            dualSim && imei2.isBlank() -> { imei2 = code; slot2Error = null }
            else -> { imei1 = code; imei2 = ""; slot1Error = null; slot2Error = null }
        }
        stageIfComplete(fromCamera)
    }

    Column(modifier) {
        // Autofill from a typed/scanned IMEI or box code (ADR 0031). It only fills
        // the model + empty storage/colour; it never blocks the scan/save below.
        LookupField(
            models = sellable,
            online = online,
            canLearn = canLearn,
            repo = repo,
            onFill = { modelId, storageOpt, colorOpt ->
                val picked = modelId?.let { id -> sellable.firstOrNull { it.id == id } }
                if (picked != null && picked.id != model?.id) {
                    val kindChanged = (model?.isSerial == true) != (picked.isSerial == true)
                    if (kindChanged) {
                        imei1 = ""; imei2 = ""; serial = ""
                        slot1Error = null; slot2Error = null; serialError = null; resetKey++
                    }
                    model = picked
                    specs.clear()
                }
                val merged = LookupFill.fill(specs.toMap(), storageOpt, colorOpt)
                specs.clear(); specs.putAll(merged)
                stageIfComplete(false)
            },
        )
        Spacer(Modifier.height(Tokens.Space.section))
        key(resetKey) {
            if (isSerial) {
                Column {
                    Text(t("catalog.serialNumber", null), style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(Tokens.Space.rowV))
                    ScannerField(onScan = ::onSerialScan, placeholder = t("catalog.serialNumberHint", null))
                    SlotHint(serial, serialError)
                }
            } else {
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
                        ScannerField(onScan = ::fillNextSlot, placeholder = t("inventory.imei2Hint", null), autofocus = false)
                        SlotHint(imei2, slot2Error)
                    }
                }
            }
        }
        Spacer(Modifier.height(Tokens.Space.section))
        IntakeBatchDefaults(
            models = sellable,
            model = model,
            onModelSelect = { picked ->
                val kindChanged = (model?.isSerial == true) != (picked?.isSerial == true)
                if (kindChanged) { imei1 = ""; imei2 = ""; serial = ""; slot1Error = null; slot2Error = null; serialError = null; resetKey++ }
                model = picked; specs.clear(); stageIfComplete(false)
            },
            specs = specs,
            onSpecChange = { k, v -> specs[k] = v; stageIfComplete(false) },
            cost = cost,
            onCostChange = { cost = it; stageIfComplete(false) },
            target = target,
            onTargetChange = { target = it },
            hintKey = hintKey,
        )
        if (canExpense) {
            Spacer(Modifier.height(Tokens.Space.section))
            ExpenseDefaults(
                expense = expense,
                onExpenseChange = { expense = it; stageIfComplete(false) },
                note = expenseNote,
                onNoteChange = { expenseNote = it },
            )
        }
    }

    pending?.let { d ->
        ScanConfirmSheet(
            code = d.code,
            confirmLabel = t("shipments.addDevice", null),
            cancelLabel = t("common.cancel", null),
            closeLabel = t("common.close", null),
            onConfirm = { commit(d); pending = null },
            onDismiss = { pending = null },
            title = models.firstOrNull { it.id == d.modelId }?.label,
            price = d.acquisitionCost.toString(),
            subtitle = d.imei2?.takeIf { it.isNotBlank() }?.let { "${t("inventory.imei2", null)}: $it" },
        )
    }
}
