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
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.ConsignWriteViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SubjectBlock
import uz.malika.erp.ui.theme.Tokens

/** Settle an OUT consignment into a sale (offline-capable via the outbox). */
@Composable
fun SettleConsignmentSheet(container: AppContainer, item: ConsignmentViewDto, onDismiss: () -> Unit) {
    val t = LocalT.current
    val vm: ConsignWriteViewModel = viewModel(
        key = "settle-${item.id}",
        factory = viewModelFactory { initializer { ConsignWriteViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    LaunchedEffect(state.done) { if (state.done) onDismiss() }

    var salePrice by remember { mutableStateOf(item.agreedPrice.money()) }
    var notes by remember { mutableStateOf("") }
    val priceValue = salePrice.trim().toDoubleOrNull() ?: 0.0

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("consignments.settle", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            SubjectBlock(item.partnerShopName.ifBlank { "—" }, item.imei) {
                MoneyText(item.agreedPrice.money(), style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.muted))
            }
            AppFormField(t("consignments.settlePrice", null), salePrice, { salePrice = it }, keyboardType = KeyboardType.Number)
            AppFormField(t("common.notes", null), notes, { notes = it })
            Text(t("consignments.settleHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            ActionError(state.error, state.offline)
            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("consignments.settle", null),
                onClick = {
                    if (priceValue <= 0.0) return@PillButton
                    vm.settle(item.id, item.imei, priceValue, notes.trim().ifBlank { null })
                },
                enabled = !state.submitting && priceValue > 0.0,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
