package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.model.CustomersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** The customer being created (id == null) or edited, with its current values. */
data class FormTarget(val id: String?, val name: String, val phone: String?, val notes: String?)

/**
 * New/edit customer dialog. Creating and updating are ONLINE-only writes (no
 * offline handler), so submit blocks with a needs-connection message offline.
 */
@Composable
fun CustomerFormDialog(vm: CustomersViewModel, target: FormTarget, online: Boolean, onClose: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val ui by vm.form.collectAsState()
    var name by remember { mutableStateOf(target.name) }
    var phone by remember { mutableStateOf(target.phone ?: "") }
    var notes by remember { mutableStateOf(target.notes ?: "") }
    var nameError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, t("sales.customerSaved", null), Toast.LENGTH_SHORT).show()
            vm.resetForm()
            onClose()
        }
    }

    AlertDialog(
        onDismissRequest = { if (!ui.busy) { vm.resetForm(); onClose() } },
        shape = RoundedCornerShape(20.dp),
        containerColor = Tokens.surfaceCanvas,
        title = { Text(t(if (target.id == null) "sales.newCustomer" else "common.edit", null)) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                AppFormField(t("sales.customerName", null), name, { name = it; nameError = null }, enabled = !ui.busy, error = nameError)
                Spacer(Modifier.height(12.dp))
                AppFormField(t("sales.customerPhone", null), phone, { phone = it }, enabled = !ui.busy, keyboardType = KeyboardType.Phone)
                Spacer(Modifier.height(12.dp))
                AppFormField(t("sales.customerNotes", null), notes, { notes = it }, enabled = !ui.busy)
                ui.error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(t(it, null), color = Tokens.danger, style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = {
            PillButton(
                text = t("common.save", null),
                onClick = {
                    if (name.trim().isEmpty()) { nameError = t("common.required", null); return@PillButton }
                    vm.submit(target.id, name.trim(), phone.trim(), notes.trim(), online)
                },
                enabled = !ui.busy,
            )
        },
        dismissButton = {
            TextButton(onClick = { vm.resetForm(); onClose() }, enabled = !ui.busy) {
                Text(t("common.cancel", null))
            }
        },
    )
}
