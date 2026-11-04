package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.sales.model.CustomersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** The customer being created (id == null) or edited, with its current values. */
data class FormTarget(val id: String?, val name: String, val phone: String?, val notes: String?)

/**
 * New / edit customer as a Warm Card sheet. Creating and updating are
 * ONLINE-only writes (no offline handler), so submit blocks with a
 * needs-connection message offline.
 */
@Composable
fun CustomerFormSheet(vm: CustomersViewModel, target: FormTarget, online: Boolean, onClose: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val ui by vm.form.collectAsState()
    var name by remember { mutableStateOf(target.name) }
    var phone by remember { mutableStateOf(target.phone ?: "") }
    var notes by remember { mutableStateOf(target.notes ?: "") }
    var nameError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, t("customers.saved", null), Toast.LENGTH_SHORT).show()
            vm.resetForm()
            onClose()
        }
    }

    AppBottomSheet(onDismiss = { if (!ui.busy) { vm.resetForm(); onClose() } }) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(
                t(if (target.id == null) "customers.newTitle" else "customers.editTitle", null),
                style = MaterialTheme.typography.titleLarge,
                color = Tokens.text,
            )
            if (!online) Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
            AppFormField(t("customers.name", null), name, { name = it; nameError = null }, enabled = !ui.busy, error = nameError)
            AppFormField(t("customers.phone", null), phone, { phone = it }, enabled = !ui.busy, keyboardType = KeyboardType.Phone)
            AppFormField(t("customers.notes", null), notes, { notes = it }, enabled = !ui.busy, placeholder = t("customers.notesPlaceholder", null))
            ui.error?.let { Text(t(it, null), color = Tokens.danger, style = MaterialTheme.typography.bodySmall) }
            PillButton(
                text = t("common.save", null),
                onClick = {
                    if (name.trim().isEmpty()) { nameError = t("customers.errNameRequired", null); return@PillButton }
                    vm.submit(target.id, name.trim(), phone.trim(), notes.trim(), online)
                },
                enabled = !ui.busy && online,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
