package uz.malika.erp.features.nasiya.ui

import uz.malika.erp.features.nasiya.data.code

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
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.model.ConsignWriteViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.SubjectBlock
import uz.malika.erp.ui.theme.Tokens

/** Return an OUT consignment to stock or defective (offline-capable). */
@Composable
fun ReturnConsignmentSheet(container: AppContainer, item: ConsignmentViewDto, onDismiss: () -> Unit) {
    val t = LocalT.current
    val vm: ConsignWriteViewModel = viewModel(
        key = "return-${item.id}",
        factory = viewModelFactory { initializer { ConsignWriteViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    LaunchedEffect(state.done) { if (state.done) onDismiss() }

    var condition by remember { mutableStateOf("IN_STOCK") }
    var reason by remember { mutableStateOf("") }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("consignments.return", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            SubjectBlock(item.partnerShopName.ifBlank { "—" }, item.code)
            Text(t("consignments.returnCondition", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
            SegmentedControl(
                options = listOf(
                    SegmentOption("IN_STOCK", t("consignments.conditionInStock", null)),
                    SegmentOption("DEFECTIVE", t("consignments.conditionDefective", null)),
                ),
                selected = condition,
                onSelect = { condition = it },
            )
            AppFormField(t("consignments.returnReason", null), reason, { reason = it })
            ActionError(state.error, state.offline)
            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("consignments.return", null),
                onClick = { vm.returnToStock(item.id, item.code, reason.trim().ifBlank { null }, condition) },
                enabled = !state.submitting,
                variant = ButtonVariant.DESTRUCTIVE,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
