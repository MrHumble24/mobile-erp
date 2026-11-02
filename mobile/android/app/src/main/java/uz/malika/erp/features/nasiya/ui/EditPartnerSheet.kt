package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.nasiya.data.UpdatePartnerBody
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.PartnerWriteViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/**
 * Edit a partner. Loads the full row online first (the mirror lacks
 * contact/telegram/notes/isActive) so PATCH never blanks them. Online-only.
 */
@Composable
fun EditPartnerSheet(container: AppContainer, partnerId: String, fallbackName: String, onDismiss: () -> Unit) {
    val t = LocalT.current
    val vm: PartnerWriteViewModel = viewModel(
        key = "partner-edit-$partnerId",
        factory = viewModelFactory { initializer { PartnerWriteViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    val detail by vm.detail.collectAsState()
    LaunchedEffect(partnerId) { vm.loadDetail(partnerId) }
    LaunchedEffect(state.done) { if (state.done) onDismiss() }

    var shopName by remember { mutableStateOf(fallbackName) }
    var contactPerson by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var telegram by remember { mutableStateOf("") }
    var creditLimit by remember { mutableStateOf("0") }
    var notes by remember { mutableStateOf("") }
    var isActive by remember { mutableStateOf(true) }

    LaunchedEffect(detail) {
        detail?.let { d ->
            shopName = d.shopName
            contactPerson = d.contactPerson.orEmpty()
            phone = d.phone.orEmpty()
            telegram = d.telegramHandle.orEmpty()
            creditLimit = d.creditLimit.money()
            notes = d.notes.orEmpty()
            isActive = d.isActive
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(t("partners.editPartner", null), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            if (detail == null) {
                Text(t("common.loading", null), style = MaterialTheme.typography.bodyMedium)
                ActionError(null, offline = !container.connectivity.online.value)
            } else {
                AppFormField(t("partners.name", null), shopName, { shopName = it })
                AppFormField(t("partners.contactPerson", null), contactPerson, { contactPerson = it })
                AppFormField(t("partners.phone", null), phone, { phone = it }, keyboardType = KeyboardType.Phone)
                AppFormField(t("partners.telegramHandle", null), telegram, { telegram = it })
                AppFormField(t("partners.creditLimit", null), creditLimit, { creditLimit = it }, keyboardType = KeyboardType.Number)
                AppFormField(t("common.notes", null), notes, { notes = it })
                SegmentedControl(
                    options = listOf(
                        SegmentOption(true, t("partners.active", null)),
                        SegmentOption(false, t("partners.inactive", null)),
                    ),
                    selected = isActive,
                    onSelect = { isActive = it },
                )
                ActionError(state.error, state.offline)
                PillButton(
                    text = if (state.submitting) t("common.loading", null) else t("common.save", null),
                    onClick = {
                        if (shopName.isBlank()) return@PillButton
                        vm.update(
                            partnerId,
                            UpdatePartnerBody(
                                shopName = shopName.trim(),
                                contactPerson = contactPerson.trim().ifBlank { null },
                                phone = phone.trim().ifBlank { null },
                                telegramHandle = telegram.trim().ifBlank { null },
                                creditLimit = creditLimit.trim().toDoubleOrNull() ?: 0.0,
                                notes = notes.trim().ifBlank { null },
                                isActive = isActive,
                            ),
                        )
                    },
                    enabled = !state.submitting && shopName.isNotBlank(),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
