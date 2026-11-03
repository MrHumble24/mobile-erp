package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.features.nasiya.model.PartnerActive
import uz.malika.erp.features.nasiya.model.PartnersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens
import java.math.BigDecimal

/**
 * Partner directory. Online it reads `/partners` with active/overdue facets;
 * offline it falls back to the local mirror (search only). Each row opens a
 * ledger sheet; `partner.payment` holders can record a payment, `partner.manage`
 * holders can add/edit a partner, `consignment.create` holders can consign.
 */
@Composable
fun PartnersScreen(container: AppContainer) {
    val t = LocalT.current
    val can = LocalCan.current
    val vm: PartnersViewModel = viewModel(
        factory = viewModelFactory { initializer { PartnersViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    val filters by vm.filters.collectAsState()
    val online by vm.online.collectAsState()

    var createOpen by remember { mutableStateOf(false) }
    var ledgerFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var paymentFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var editFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var consignFor by remember { mutableStateOf<PartnerEntity?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (can("partner.manage")) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                PillButton(t("partners.newPartner", null), onClick = { createOpen = true })
            }
        }

        AppTextField(
            value = filters.search,
            onValueChange = vm::setSearch,
            placeholder = t("partners.searchPlaceholder", null),
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
        )

        PartnerFilters(
            active = filters.active,
            overdue = filters.overdue,
            enabled = online, // active/overdue need the server; mirror can't serve them
            onActive = vm::setActive,
            onOverdue = vm::setOverdue,
            onReset = vm::reset,
        )

        PartnersSummary(state.items)

        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!)
            state.items.isEmpty() -> EmptyView(t("partners.noPartnersFound", null))
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.items, key = { it.id }) { partner ->
                    PartnerCard(
                        partner = partner,
                        canPay = can("partner.payment"),
                        onOpenLedger = { ledgerFor = partner },
                        onRecordPayment = { paymentFor = partner },
                    )
                }
            }
        }
    }

    if (createOpen) CreatePartnerSheet(container) { createOpen = false }
    ledgerFor?.let { p ->
        PartnerLedgerSheet(
            container = container,
            partner = p,
            onDismiss = { ledgerFor = null },
            onRecordPayment = { ledgerFor = null; paymentFor = p },
            onEdit = { ledgerFor = null; editFor = p },
            onNewConsignment = { ledgerFor = null; consignFor = p },
        )
    }
    paymentFor?.let { p -> RecordPaymentSheet(container, p) { paymentFor = null } }
    editFor?.let { p -> EditPartnerSheet(container, p.id, p.shopName) { editFor = null } }
    consignFor?.let { p -> ConsignDeviceSheet(container, p.id, p.shopName) { consignFor = null } }
}

@Composable
private fun PartnerFilters(
    active: PartnerActive,
    overdue: Boolean,
    enabled: Boolean,
    onActive: (PartnerActive) -> Unit,
    onOverdue: (Boolean) -> Unit,
    onReset: () -> Unit,
) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SegmentedControl(
            options = listOf(
                SegmentOption(PartnerActive.ALL, t("common.all", null)),
                SegmentOption(PartnerActive.ACTIVE, t("partners.active", null)),
                SegmentOption(PartnerActive.INACTIVE, t("partners.inactive", null)),
            ),
            selected = active,
            onSelect = { if (enabled) onActive(it) },
        )
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatusChip(
                label = t("partners.overdueOnly", null),
                color = if (overdue && enabled) Tokens.destructive else Tokens.slate,
                modifier = if (enabled) Modifier.clickable { onOverdue(!overdue) } else Modifier,
            )
            PillButton(t("partners.resetFilters", null), onClick = onReset, variant = ButtonVariant.GHOST)
        }
    }
}

@Composable
private fun PartnersSummary(partners: List<PartnerEntity>) {
    val t = LocalT.current
    val total = partners.fold(BigDecimal.ZERO) { acc, p -> acc + parseMoney(p.outstanding) }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        MetricTile(t("partners.statsPartners", null), partners.size.toString(), money = false, modifier = Modifier.weight(1f))
        MetricTile(t("partners.statsOutstanding", null), formatMoney(total.toPlainString()), money = false, modifier = Modifier.weight(1f))
    }
}
