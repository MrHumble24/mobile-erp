package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.LookupBody
import uz.malika.erp.features.procurement.data.LookupDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.lib.isValidLookupCode
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/** Create or edit a QC lookup (`kind` = `grades` | `defect-types`). Online-only. */
@Composable
fun LookupFormSheet(
    kind: String,
    existing: LookupDto?,
    online: Boolean,
    repo: ProcurementRepository,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val editing = existing != null
    var code by remember { mutableStateOf(existing?.code ?: "") }
    var label by remember { mutableStateOf(existing?.label ?: "") }
    var sortOrder by remember { mutableStateOf(existing?.sortOrder?.toString() ?: "") }
    var active by remember { mutableStateOf(existing?.isActive ?: true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        if (!editing && !isValidLookupCode(code)) {
            error = if (code.isBlank()) t("common.required", null) else t("qc.codeFormat", null)
            return
        }
        if (label.isBlank()) { error = t("common.required", null); return }
        if (!online) { error = t("common.offline", null); return }
        busy = true; error = null
        val sort = sortOrder.trim().toIntOrNull()
        scope.launch {
            try {
                if (existing == null) {
                    repo.createLookup(kind, LookupBody(code = code.trim(), label = label.trim(), sortOrder = sort))
                } else {
                    repo.updateLookup(kind, existing.code, LookupBody(label = label.trim(), sortOrder = sort, isActive = active))
                }
                onSaved(); onDismiss()
            } catch (e: AppException) {
                error = if (e.statusCode == 409) t("qc.codeDuplicate", null) else e.message
            } finally {
                busy = false
            }
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text(
                t(if (kind == "grades") "qc.grades" else "qc.defectTypes", null),
                style = MaterialTheme.typography.titleLarge,
            )
            Spacer(Modifier.height(16.dp))
            AppFormField(t("qc.lookupCode", null), code, { code = it.uppercase() }, enabled = !editing)
            Spacer(Modifier.height(12.dp))
            AppFormField(t("qc.lookupLabel", null), label, { label = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(t("qc.sortOrder", null), sortOrder, { sortOrder = it }, keyboardType = KeyboardType.Number)
            if (editing) {
                Spacer(Modifier.height(16.dp))
                Text(t("qc.active", null), style = MaterialTheme.typography.labelLarge)
                Spacer(Modifier.height(6.dp))
                SegmentedControl(
                    options = listOf(
                        SegmentOption(true, t("qc.active", null)),
                        SegmentOption(false, t("common.no", null)),
                    ),
                    selected = active,
                    onSelect = { active = it },
                )
            }
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
}
