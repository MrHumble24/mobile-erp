package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.features.nasiya.model.PartnersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.PillButton
import java.math.BigDecimal

/**
 * Partner directory (offline-first from the local mirror). Each row opens a
 * ledger sheet; `partner.payment` holders can record a payment, `partner.manage`
 * holders can add/edit a partner, `consignment.create` holders can consign from
 * the ledger sheet.
 */
@Composable
fun PartnersScreen(container: AppContainer) {
    val t = LocalT.current
    val can = LocalCan.current
    val vm: PartnersViewModel = viewModel(
        factory = viewModelFactory { initializer { PartnersViewModel(container) } },
    )
    val partners by vm.partners.collectAsState()
    val search by vm.search.collectAsState()

    var createOpen by remember { mutableStateOf(false) }
    var ledgerFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var paymentFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var editFor by remember { mutableStateOf<PartnerEntity?>(null) }
    var consignFor by remember { mutableStateOf<PartnerEntity?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("partners.title", null), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            if (can("partner.manage")) {
                PillButton(t("partners.newPartner", null), onClick = { createOpen = true })
            }
        }

        AppTextField(
            value = search,
            onValueChange = vm::setSearch,
            placeholder = t("partners.searchPlaceholder", null),
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
        )

        PartnersSummary(partners)

        if (partners.isEmpty()) {
            EmptyView(t("partners.noPartnersFound", null))
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(partners, key = { it.id }) { partner ->
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
private fun PartnersSummary(partners: List<PartnerEntity>) {
    val t = LocalT.current
    val total = partners.fold(BigDecimal.ZERO) { acc, p -> acc + parseMoney(p.outstanding) }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        MetricTile(t("partners.statsPartners", null), partners.size.toString(), modifier = Modifier.weight(1f))
        MetricTile(t("partners.statsOutstanding", null), formatMoney(total.toPlainString()), modifier = Modifier.weight(1f))
    }
}
