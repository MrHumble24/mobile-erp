package uz.malika.erp.features.procurement.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.app.LocalCan
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.CreateInspectionBody
import uz.malika.erp.features.procurement.data.InspectionDefectBody
import uz.malika.erp.features.procurement.data.LookupDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.QcDeviceDto
import uz.malika.erp.features.procurement.model.AsyncContent
import uz.malika.erp.features.procurement.model.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCheckbox
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

private data class GradeInputs(val device: QcDeviceDto, val grades: List<LookupDto>, val defects: List<LookupDto>)

/** Grade a device by IMEI (online-only). On success invokes [onSaved] and toasts. */
@Composable
fun GradeDeviceSheet(
    imei: String,
    online: Boolean,
    repo: ProcurementRepository,
    toaster: Toaster,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val loaded = rememberAsync(imei) {
        GradeInputs(repo.deviceByImei(imei), repo.lookups("grades", false), repo.lookups("defect-types", false))
    }
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.padding(Tokens.Space.gutter)) {
            AsyncContent(loaded) { GradeForm(it, online, repo, toaster, onSaved, onDismiss) }
        }
    }
}

@Composable
private fun GradeForm(
    inputs: GradeInputs,
    online: Boolean,
    repo: ProcurementRepository,
    toaster: Toaster,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val canCost = LocalCan.current("device.cost.view")
    var passed by remember { mutableStateOf(true) }
    var grade by remember { mutableStateOf<LookupDto?>(null) }
    var battery by remember { mutableStateOf("100") }
    var repairCost by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    val selected = remember { mutableListOf<String>().toMutableStateList() }
    val defectNotes = remember { mutableStateMapOf<String, String>() }
    var busy by remember { mutableStateOf(false) }
    var defectError by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        if (!passed && selected.isEmpty()) { defectError = true; return }
        if (!online) { error = t("common.offline", null); return }
        busy = true; error = null
        val repair = repairCost.trim().toDoubleOrNull()
        val body = CreateInspectionBody(
            deviceId = inputs.device.id,
            passed = passed,
            gradeCode = grade?.code,
            batteryHealth = battery.trim().toIntOrNull(),
            repairCostEstimate = if (canCost && repair != null && repair > 0) repair else null,
            notes = notes.trim().ifBlank { null },
            defects = selected.map { InspectionDefectBody(it, defectNotes[it]?.trim()?.ifBlank { null }) },
        )
        scope.launch {
            try {
                repo.createInspection(body)
                toaster.success(t("common.success", null))
                onSaved(); onDismiss()
            } catch (e: AppException) {
                error = e.message
            } finally {
                busy = false
            }
        }
    }

    Column(Modifier.verticalScroll(rememberScrollState())) {
        Text(t("qc.runInspection", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.md))
        // The unit under inspection: a surface-2 block, never a card nested in the sheet.
        Column(
            Modifier.fillMaxWidth()
                .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
                .padding(Tokens.Space.lg),
        ) {
            Text(inputs.device.modelLabel, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
            ImeiText(inputs.device.code, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(Tokens.Space.lg))
        SegmentedControl(
            options = listOf(
                SegmentOption(true, t("qc.passed", null)),
                SegmentOption(false, t("qc.failed", null)),
            ),
            selected = passed,
            onSelect = { passed = it },
        )
        Spacer(Modifier.height(Tokens.Space.lg))
        AppSelect(
            label = t("qc.grade", null),
            value = grade,
            options = inputs.grades,
            optionLabel = { it.label },
            onSelect = { grade = it },
            placeholder = t("qc.selectGrade", null),
        )
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("qc.batteryHealth", null), battery, { battery = it }, keyboardType = KeyboardType.Number)
        if (canCost) {
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(t("qc.repairCostEstimate", null), repairCost, { repairCost = it }, keyboardType = KeyboardType.Decimal)
        }
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("common.notes", null), notes, { notes = it })
        Spacer(Modifier.height(Tokens.Space.lg))
        DefectsChecklist(
            defects = inputs.defects,
            selected = selected,
            notes = defectNotes,
            hasError = defectError,
            onToggle = { code, on ->
                if (on) selected.add(code) else selected.remove(code)
                defectError = false
            },
        )
        error?.let {
            Spacer(Modifier.height(Tokens.Space.md))
            Text(it, color = Tokens.danger, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(Tokens.Space.gutter))
        PillButton(
            text = t(if (busy) "common.loading" else "common.save", null),
            onClick = ::submit,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(Tokens.Space.sm))
    }
}

@Composable
private fun DefectsChecklist(
    defects: List<LookupDto>,
    selected: List<String>,
    notes: MutableMap<String, String>,
    hasError: Boolean,
    onToggle: (String, Boolean) -> Unit,
) {
    val t = LocalT.current
    if (defects.isEmpty()) return
    Column {
        Text(
            t("qc.defects", null),
            style = MaterialTheme.typography.titleMedium,
            color = if (hasError) Tokens.danger else Tokens.text,
        )
        Spacer(Modifier.height(Tokens.Space.xs))
        defects.forEach { d ->
            val checked = selected.contains(d.code)
            Row(
                Modifier.fillMaxWidth().clickable { onToggle(d.code, !checked) }.heightIn(min = Tokens.minTouch),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AppCheckbox(checked = checked, onCheckedChange = { onToggle(d.code, it) })
                Text(d.label, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            }
            if (checked) {
                AppFormField(
                    label = t("qc.defectNotes", null),
                    value = notes[d.code] ?: "",
                    onValueChange = { notes[d.code] = it },
                    modifier = Modifier.padding(start = 48.dp, bottom = Tokens.Space.sm),
                )
            }
        }
        if (hasError) {
            Spacer(Modifier.height(Tokens.Space.xs))
            Text(t("qc.failNeedsDefect", null), color = Tokens.danger, style = MaterialTheme.typography.bodySmall)
        }
    }
}
