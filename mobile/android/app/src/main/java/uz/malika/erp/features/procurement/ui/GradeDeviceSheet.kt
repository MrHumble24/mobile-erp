package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckBox
import androidx.compose.material.icons.outlined.CheckBoxOutlineBlank
import androidx.compose.material3.Icon
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
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private data class GradeInputs(val device: QcDeviceDto, val grades: List<LookupDto>, val defects: List<LookupDto>)

/** Grade a device by IMEI (online-only). On success invokes [onSaved]. */
@Composable
fun GradeDeviceSheet(
    imei: String,
    online: Boolean,
    repo: ProcurementRepository,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val loaded = rememberAsync(imei) {
        GradeInputs(repo.deviceByImei(imei), repo.lookups("grades", false), repo.lookups("defect-types", false))
    }
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.padding(16.dp)) {
            AsyncContent(loaded) { GradeForm(it, online, repo, onSaved, onDismiss) }
        }
    }
}

@Composable
private fun GradeForm(
    inputs: GradeInputs,
    online: Boolean,
    repo: ProcurementRepository,
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
                onSaved(); onDismiss()
            } catch (e: AppException) {
                error = e.message
            } finally {
                busy = false
            }
        }
    }

    Column(Modifier.verticalScroll(rememberScrollState())) {
        Text(t("qc.runInspection", null), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        AppCard {
            ImeiText(inputs.device.imei, style = MaterialTheme.typography.bodyMedium)
            Text(inputs.device.modelLabel, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(16.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption(true, t("qc.passed", null)),
                SegmentOption(false, t("qc.failed", null)),
            ),
            selected = passed,
            onSelect = { passed = it },
        )
        Spacer(Modifier.height(16.dp))
        AppSelect(
            label = t("qc.grade", null),
            value = grade,
            options = inputs.grades,
            optionLabel = { it.label },
            onSelect = { grade = it },
            placeholder = t("qc.selectGrade", null),
        )
        Spacer(Modifier.height(12.dp))
        AppFormField(t("qc.batteryHealth", null), battery, { battery = it }, keyboardType = KeyboardType.Number)
        if (canCost) {
            Spacer(Modifier.height(12.dp))
            AppFormField(t("qc.repairCostEstimate", null), repairCost, { repairCost = it }, keyboardType = KeyboardType.Decimal)
        }
        Spacer(Modifier.height(12.dp))
        AppFormField(t("common.notes", null), notes, { notes = it })
        Spacer(Modifier.height(16.dp))
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
            Spacer(Modifier.height(12.dp))
            Text(it, color = Tokens.destructive, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(20.dp))
        PillButton(
            text = t(if (busy) "common.loading" else "common.save", null),
            onClick = ::submit,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
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
    val color = if (hasError) Tokens.destructive else Tokens.foreground
    Column {
        Text(t("qc.defects", null), style = MaterialTheme.typography.labelLarge, color = color)
        Spacer(Modifier.height(6.dp))
        defects.forEach { d ->
            val checked = selected.contains(d.code)
            Row(
                Modifier.fillMaxWidth().clickable { onToggle(d.code, !checked) }.padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    if (checked) Icons.Outlined.CheckBox else Icons.Outlined.CheckBoxOutlineBlank,
                    contentDescription = null,
                    tint = if (checked) Tokens.primary else Tokens.ash,
                )
                Spacer(Modifier.height(0.dp))
                Text("  " + d.label, style = MaterialTheme.typography.bodyMedium)
            }
            if (checked) {
                AppFormField(
                    label = t("qc.defectNotes", null),
                    value = notes[d.code] ?: "",
                    onValueChange = { notes[d.code] = it },
                    modifier = Modifier.padding(start = 32.dp, bottom = 8.dp),
                )
            }
        }
        if (hasError) {
            Spacer(Modifier.height(4.dp))
            Text(t("qc.failNeedsDefect", null), color = Tokens.destructive, style = MaterialTheme.typography.bodySmall)
        }
    }
}
