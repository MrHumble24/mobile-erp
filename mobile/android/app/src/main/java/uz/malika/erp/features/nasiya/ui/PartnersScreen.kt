package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.ui.theme.Tokens
import java.math.BigDecimal

/**
 * Partner directory. Online it reads `/partners` with active/overdue facets;
 * offline it falls back to the local mirror (search only). Search is inline; the
 * active/overdue facets live in [PartnerFilterSheet]. Each row opens a ledger
 * sheet; `partner.payment` holders can record a payment, `partner.manage`
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

    var showFilters by remember { mutableStateOf(false) }
    var createOpen by remember { mutableStateOf(false) }
    var ledgerFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var paymentFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var editFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var consignFor by remember { mutableStateOf<PartnerEntity?>(null) }

    val activeFilters = listOf(
        filters.active != PartnerActive.ALL,
        filters.overdue,
    ).count { it }

    Column(
        Modifier.fillMaxSize().padding(Tokens.Space.section),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.section),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            SearchFilterRow(
                query = filters.search,
                onQueryChange = vm::setSearch,
                placeholder = t("partners.searchPlaceholder", null),
                activeCount = activeFilters,
                onOpenFilters = { showFilters = true },
                modifier = Modifier.weight(1f),
            )
            if (can("partner.manage")) {
                Spacer(Modifier.width(Tokens.Space.gap))
                IconButton(onClick = { createOpen = true }) {
                    Icon(Icons.Outlined.PersonAdd, contentDescription = t("partners.newPartner", null), tint = Tokens.foreground)
                }
            }
        }

        PartnersSummary(state.items)

        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!)
            state.items.isEmpty() -> EmptyView(t("partners.noPartnersFound", null))
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
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

    if (showFilters) {
        PartnerFilterSheet(
            active = filters.active,
            overdue = filters.overdue,
            enabled = online, // active/overdue need the server; mirror can't serve them
            onActive = vm::setActive,
            onOverdue = vm::setOverdue,
            canReset = activeFilters > 0 || filters.search.isNotBlank(),
            onReset = vm::reset,
            onDismiss = { showFilters = false },
        )
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
private fun PartnersSummary(partners: List<PartnerEntity>) {
    val t = LocalT.current
    val total = partners.fold(BigDecimal.ZERO) { acc, p -> acc + parseMoney(p.outstanding) }
    MetricGrid(
        perRow = 2,
        tiles = listOf(
            { m -> MetricTile(t("partners.statsPartners", null), partners.size.toString(), m, money = false) },
            { m -> MetricTile(t("partners.statsOutstanding", null), formatMoney(total.toPlainString()), m, money = false) },
        ),
    )
}
