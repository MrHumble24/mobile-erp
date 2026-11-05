package uz.malika.erp.features.purchases.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.InventoryApi
import uz.malika.erp.features.purchases.data.CustomerPurchaseDto
import uz.malika.erp.features.purchases.data.PurchaseApi
import uz.malika.erp.features.purchases.data.PurchaseRepository
import uz.malika.erp.features.purchases.model.BuyPhoneViewModel
import uz.malika.erp.features.purchases.model.PurchasesListViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Customer purchases (More tab, ADR 0039): list + date/search filters, detail, and "Buy a phone". */
@Composable
fun PurchasesScreen(container: AppContainer) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val repo = remember { PurchaseRepository(container.retrofit.create(PurchaseApi::class.java)) }
    val vm: PurchasesListViewModel = viewModel(factory = viewModelFactory { initializer { PurchasesListViewModel(repo) } })
    val range by vm.range.collectAsState()
    val search by vm.search.collectAsState()
    val state by vm.state.collectAsState()
    val canBuy = LocalCan.current("purchase.create")

    var detail by remember { mutableStateOf<CustomerPurchaseDto?>(null) }
    var buyOpen by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(horizontal = Tokens.Space.screenH)) {
        Spacer(Modifier.height(Tokens.Space.md))
        if (canBuy) {
            PillButton(t("purchases.buyTitle", null), { buyOpen = true }, Modifier.fillMaxWidth(), enabled = online)
            Spacer(Modifier.height(Tokens.Space.sm))
        }
        AppDateRangeField(t("common.date", null), range, onPick = { vm.setRange(it) })
        Spacer(Modifier.height(Tokens.Space.sm))
        AppTextField(
            value = search,
            onValueChange = { vm.setSearch(it) },
            placeholder = t("purchases.searchByCodeHint", null),
            imeAction = ImeAction.Search,
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
            state.items.isEmpty() -> EmptyView(t("purchases.empty", null))
            else -> LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                items(state.items, key = { it.id }) { row -> PurchaseRow(row, onOpen = { detail = row }) }
            }
        }
    }

    detail?.let {
        AppBottomSheet(onDismiss = { detail = null }) { PurchaseDetailSheet(it) }
    }

    if (buyOpen) {
        AppBottomSheet(onDismiss = { buyOpen = false }) {
            val buyVm: BuyPhoneViewModel = viewModel(
                key = "buy",
                factory = viewModelFactory {
                    initializer {
                        BuyPhoneViewModel(repo, CatalogRepository(container.retrofit.create(InventoryApi::class.java)))
                    }
                },
            )
            BuyPhoneSheet(
                container = container,
                vm = buyVm,
                online = online,
                onBought = {
                    buyOpen = false
                    container.toaster.success(t("purchases.buySuccess", null))
                    vm.refresh()
                },
            )
        }
    }
}

@Composable
private fun PurchaseRow(row: CustomerPurchaseDto, onOpen: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onOpen) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(row.customer.name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(
                    "${row.unit.model.label} · ${row.code}",
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                    color = Tokens.muted,
                )
                Text(formatDate(row.occurredAt), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            row.pricePaid?.let {
                MoneyText(it, style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = Tokens.text))
            }
        }
    }
}
