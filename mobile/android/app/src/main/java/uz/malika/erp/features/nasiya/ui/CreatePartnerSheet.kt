package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.nasiya.data.CreatePartnerBody
import uz.malika.erp.features.nasiya.model.PartnerWriteViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Add a partner. Online-only (no outbox handler); blocks when offline. */
@Composable
fun CreatePartnerSheet(container: AppContainer, onDismiss: () -> Unit) {
    val t = LocalT.current
    val vm: PartnerWriteViewModel = viewModel(
        key = "partner-create",
        factory = viewModelFactory { initializer { PartnerWriteViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    LaunchedEffect(state.done) { if (state.done) onDismiss() }

    var shopName by remember { mutableStateOf("") }
    var contactPerson by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var creditLimit by remember { mutableStateOf("0") }
    var notes by remember { mutableStateOf("") }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("partners.newPartner", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            AppFormField(t("partners.name", null), shopName, { shopName = it })
            AppFormField(t("partners.contactPerson", null), contactPerson, { contactPerson = it })
            AppFormField(t("partners.phone", null), phone, { phone = it }, keyboardType = KeyboardType.Phone)
            AppFormField(t("partners.creditLimit", null), creditLimit, { creditLimit = it }, keyboardType = KeyboardType.Number)
            AppFormField(t("common.notes", null), notes, { notes = it })
            ActionError(state.error, state.offline)
            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("common.create", null),
                onClick = {
                    if (shopName.isBlank()) return@PillButton
                    vm.create(
                        CreatePartnerBody(
                            shopName = shopName.trim(),
                            contactPerson = contactPerson.trim().ifBlank { null },
                            phone = phone.trim().ifBlank { null },
                            creditLimit = creditLimit.trim().toDoubleOrNull() ?: 0.0,
                            notes = notes.trim().ifBlank { null },
                        ),
                    )
                },
                enabled = !state.submitting && shopName.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
