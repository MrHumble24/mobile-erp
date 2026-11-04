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
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.features.nasiya.data.RecordPaymentBody
import uz.malika.erp.features.nasiya.model.PartnerWriteViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Record a cash/transfer payment against a partner's balance. Online-only. */
@Composable
fun RecordPaymentSheet(container: AppContainer, partner: PartnerEntity, onDismiss: () -> Unit) {
    val t = LocalT.current
    val vm: PartnerWriteViewModel = viewModel(
        key = "partner-pay-${partner.id}",
        factory = viewModelFactory { initializer { PartnerWriteViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    LaunchedEffect(state.done) { if (state.done) onDismiss() }

    var amount by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    val amountValue = amount.trim().toDoubleOrNull() ?: 0.0
    val outstandingValue = partner.outstanding.toDoubleOrNull() ?: 0.0

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("partners.recordPayment", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            SubjectBlock(partner.shopName, "${t("partners.outstanding", null)}: ${formatMoney(partner.outstanding)}")
            AppFormField(t("partners.paymentAmount", null), amount, { amount = it }, keyboardType = KeyboardType.Number)
            if (outstandingValue > 0.0 && amount != outstandingValue.toInt().toString()) {
                PillButton(
                    text = t("partners.payFull", mapOf("amount" to formatMoney(partner.outstanding))),
                    onClick = { amount = outstandingValue.toInt().toString() },
                    modifier = Modifier.fillMaxWidth(),
                    variant = ButtonVariant.GHOST,
                )
            }
            AppFormField(t("common.notes", null), notes, { notes = it })
            ActionError(state.error, state.offline)
            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("partners.recordPayment", null),
                onClick = {
                    if (amountValue <= 0.0) return@PillButton
                    vm.recordPayment(
                        partner.id,
                        RecordPaymentBody(amount = amountValue, notes = notes.trim().ifBlank { null }),
                    )
                },
                enabled = !state.submitting && amountValue > 0.0,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
