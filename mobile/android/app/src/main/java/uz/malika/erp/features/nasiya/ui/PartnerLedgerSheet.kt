package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.shared.ui.SubjectBlock
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
            Modifier.fillMaxWidth().padding(Tokens.Space.gutter).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
        ) {
            Text(partner.shopName, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            SubjectBlock(t("partners.outstanding", null), formatMoney(partner.outstanding))
            CreditBar(partner.creditLimit, partner.outstanding)

            // Payment is the money action (the one orange); consign secondary; edit a ghost link.
            Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                if (can("partner.payment")) {
                    PillButton(t("partners.recordPayment", null), onClick = onRecordPayment, modifier = Modifier.fillMaxWidth())
                }
                if (can("consignment.create")) {
                    PillButton(t("partners.newConsignmentForPartner", null), onClick = onNewConsignment, variant = ButtonVariant.SECONDARY, modifier = Modifier.fillMaxWidth())
                }
                if (can("partner.manage")) {
                    PillButton(t("partners.editPartner", null), onClick = onEdit, variant = ButtonVariant.GHOST, modifier = Modifier.fillMaxWidth())
                }
            }

            when {
                state.loading -> Loading(Modifier.heightIn(min = 120.dp))
                state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::load)
                else -> {
                    AgingGrid(state.aging)
                    Text(t("partners.ledgerTitle", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
                    if (state.entries.isEmpty()) {
                        Text(t("partners.noLedgerEntries", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                    } else {
                        Column {
                            state.entries.forEachIndexed { i, e ->
                                LedgerRow(e)
                                if (i < state.entries.lastIndex) HorizontalDivider(color = Tokens.border)
                            }
                        }
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
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
        Text(t("partners.agingTitle", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        MetricGrid(
            perRow = 4,
            tiles = buckets.map { b ->
                { m ->
                    MetricTile(
                        t("partners.aging_${b.bucket}", null),
                        b.amount.money(),
                        m,
                        subtext = b.count.toString(),
                    )
                }
            },
        )
    }
}

@Composable
private fun LedgerRow(entry: LedgerEntryDto) {
    val t = LocalT.current
    val isConsignment = entry.kind == "consignment"
    val change = parseMoney(entry.change.money())
    val positive = change.signum() >= 0
    val signed = (if (positive) "+" else "-") + formatMoney(change.abs().toPlainString())
    // A ledger line, not a nested card: kind pill + signed mono change, then date · running balance.
    Column(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.sm)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            StatusChip(
                if (isConsignment) t("partners.kindConsignment", null) else t("partners.kindPayment", null),
                color = if (isConsignment) Tokens.info else Tokens.success,
            )
            Text(
                signed,
                style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
                color = if (positive) Tokens.warning else Tokens.success,
            )
        }
        Row(Modifier.fillMaxWidth().padding(top = Tokens.Space.xs), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(formatDate(entry.at), style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
            Text(
                "${t("partners.runningBalance", null)}: ${formatMoney(entry.runningBalance.money())}",
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.muted,
            )
        }
        entry.notes?.takeIf { it.isNotBlank() }?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted, modifier = Modifier.padding(top = Tokens.Space.xs))
        }
    }
}
