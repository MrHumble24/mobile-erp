package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.features.nasiya.data.AgingBucketDto
import uz.malika.erp.features.nasiya.data.LedgerEntryDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.LedgerViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Partner ledger + aging + the partner actions (pay / consign / edit). */
@Composable
fun PartnerLedgerSheet(
    container: AppContainer,
    partner: PartnerEntity,
    onDismiss: () -> Unit,
    onRecordPayment: () -> Unit,
    onEdit: () -> Unit,
    onNewConsignment: () -> Unit,
) {
    val t = LocalT.current
    val can = LocalCan.current
    val vm: LedgerViewModel = viewModel(
        key = "ledger-${partner.id}",
        factory = viewModelFactory { initializer { LedgerViewModel(container, partner.id) } },
    )
    val state by vm.state.collectAsState()

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(20.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(partner.shopName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(
                "${t("partners.outstanding", null)}: ${formatMoney(partner.outstanding)}",
                style = MaterialTheme.typography.bodyMedium,
                color = Tokens.mutedForeground,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (can("partner.payment")) {
                    PillButton(t("partners.recordPayment", null), onClick = onRecordPayment)
                }
                if (can("consignment.create")) {
                    PillButton(t("partners.newConsignmentForPartner", null), onClick = onNewConsignment, variant = ButtonVariant.OUTLINE)
                }
                if (can("partner.manage")) {
                    PillButton(t("partners.editPartner", null), onClick = onEdit, variant = ButtonVariant.OUTLINE)
                }
            }

            when {
                state.loading -> Loading(Modifier.heightIn(min = 120.dp))
                state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::load)
                else -> {
                    AgingGrid(state.aging)
                    Text(t("partners.ledgerTitle", null), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    if (state.entries.isEmpty()) {
                        Text(t("partners.noLedgerEntries", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.mutedForeground)
                    } else {
                        state.entries.forEach { LedgerRow(it) }
                    }
                }
            }
        }
    }
}

@Composable
private fun AgingGrid(buckets: List<AgingBucketDto>) {
    val t = LocalT.current
    if (buckets.none { it.count > 0 }) return
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(t("partners.agingTitle", null), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            buckets.forEach { b ->
                AppCard(modifier = Modifier.width(96.dp), padding = androidx.compose.foundation.layout.PaddingValues(10.dp)) {
                    Text(t("partners.aging_${b.bucket}", null), style = MaterialTheme.typography.labelSmall, color = Tokens.mutedForeground)
                    MoneyText(b.amount.money(), style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold))
                    Text(b.count.toString(), style = MaterialTheme.typography.labelSmall, color = Tokens.mutedForeground)
                }
            }
        }
    }
}

@Composable
private fun LedgerRow(entry: LedgerEntryDto) {
    val t = LocalT.current
    val isConsignment = entry.kind == "consignment"
    val change = parseMoney(entry.change.money())
    val positive = change.signum() >= 0
    val signed = (if (positive) "+" else "-") + formatMoney(change.abs().toPlainString())
    AppCard(padding = androidx.compose.foundation.layout.PaddingValues(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            StatusChip(
                if (isConsignment) t("partners.kindConsignment", null) else t("partners.kindPayment", null),
                color = if (isConsignment) Tokens.brandViolet else Tokens.emerald,
            )
            Text(
                signed,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = if (positive) Tokens.warning else Tokens.success,
            )
        }
        Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(entry.at.take(10), style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
            Text(
                "${t("partners.runningBalance", null)}: ${formatMoney(entry.runningBalance.money())}",
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.mutedForeground,
            )
        }
        entry.notes?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground, modifier = Modifier.padding(top = 4.dp))
        }
    }
}
