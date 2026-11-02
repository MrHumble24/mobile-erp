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
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.SupplierBody
import uz.malika.erp.features.procurement.data.SupplierDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/** Create or edit a supplier (online-only write). Invokes [onSaved] then dismisses. */
@Composable
fun SupplierFormSheet(
    existing: SupplierDto?,
    online: Boolean,
    repo: ProcurementRepository,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var country by remember { mutableStateOf(existing?.country ?: "") }
    var contact by remember { mutableStateOf(existing?.contact ?: "") }
    var notes by remember { mutableStateOf(existing?.notes ?: "") }
    var active by remember { mutableStateOf(existing?.isActive ?: true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val editing = existing != null

    fun submit() {
        if (name.isBlank()) { error = t("common.required", null); return }
        if (!online) { error = t("common.offline", null); return }
        busy = true; error = null
        scope.launch {
            try {
                val body = SupplierBody(
                    name = name.trim(),
                    country = country.trim().ifBlank { null },
                    contact = contact.trim().ifBlank { null },
                    notes = notes.trim().ifBlank { null },
                    isActive = if (editing) active else null,
                )
                if (existing == null) repo.createSupplier(body) else repo.updateSupplier(existing.id, body)
                onSaved(); onDismiss()
            } catch (e: AppException) {
                error = if (e.statusCode == 409) t("shipments.supplierDuplicate", null) else e.message
            } finally {
                busy = false
            }
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text(
                t(if (editing) "shipments.editSupplier" else "shipments.newSupplier", null),
                style = MaterialTheme.typography.titleLarge,
            )
            Spacer(Modifier.height(16.dp))
            AppFormField(t("shipments.supplierName", null), name, { name = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(t("shipments.supplierCountry", null), country, { country = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(t("shipments.supplierContact", null), contact, { contact = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(t("common.notes", null), notes, { notes = it })
            if (editing) {
                Spacer(Modifier.height(16.dp))
                Text(t("shipments.supplierActive", null), style = MaterialTheme.typography.labelLarge)
                Spacer(Modifier.height(6.dp))
                SegmentedControl(
                    options = listOf(
                        SegmentOption(true, t("shipments.supplierActive", null)),
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
