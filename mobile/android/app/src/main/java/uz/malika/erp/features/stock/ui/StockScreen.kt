package uz.malika.erp.features.stock.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.delay
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.stock.data.StockCategory
import uz.malika.erp.features.stock.data.StockLevel
import uz.malika.erp.features.stock.data.StockRepository
import uz.malika.erp.features.stock.model.StockViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Quantity-product stock list (ADR 0030): search, category filter, per-product movements + adjust. */
@Composable
fun StockScreen(container: AppContainer, api: uz.malika.erp.features.stock.data.StockApi) {
    val t = LocalT.current
    val canCost = LocalCan.current("device.cost.view")
    val canAdjust = LocalCan.current("stock.adjust")
    val vm: StockViewModel = viewModel(
        factory = viewModelFactory { initializer { StockViewModel(StockRepository(api)) } },
    )
    val ui by vm.ui.collectAsState()
    val categories by vm.categories.collectAsState()
    val categoryId by vm.categoryId.collectAsState()

    var search by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<StockLevel?>(null) }

    LaunchedEffect(search) {
        delay(300)
        vm.setSearch(search.trim().takeIf { it.isNotBlank() })
    }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = listBottomPadding()) {
        item {
            Column(Modifier.padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.section)) {
                Text(t("catalog.stockTitle", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
                Spacer(Modifier.height(Tokens.Space.md))
                AppFormField(
                    label = t("catalog.scanCode", null),
                    value = search,
                    onValueChange = { search = it },
                )
                Spacer(Modifier.height(Tokens.Space.md))
                AppSelect(
                    label = t("catalog.category", null),
                    value = categories.firstOrNull { it.id == categoryId },
                    options = categories,
                    optionLabel = StockCategory::name,
                    onSelect = { vm.setCategory(it?.id) },
                    nullOption = t("catalog.allCategories", null),
                )
            }
        }
        when {
            ui.loading && ui.items.isEmpty() ->
                item { Box(Modifier.fillParentMaxWidth().padding(vertical = 64.dp), contentAlignment = Alignment.Center) { Loading() } }
            ui.error != null ->
                item { ErrorView(ui.error!!, onRetry = vm::refresh, retryLabel = t("common.retry", null)) }
            ui.items.isEmpty() ->
                item { EmptyView(t("catalog.stockEmpty", null)) }
            else -> items(ui.items, key = { it.modelId }) { level ->
                Box(Modifier.padding(horizontal = Tokens.Space.screenH)) {
                    StockRow(level, canCost) { selected = level }
                }
            }
        }
    }

    selected?.let { level ->
        AppBottomSheet(onDismiss = { selected = null }) {
            StockDetailSheet(
                level = level,
                repo = vm.repository,
                canCost = canCost,
                canAdjust = canAdjust,
                onAdjusted = { vm.refresh(); selected = null },
            )
        }
    }
}

/** One product card: name, barcode/model code, the quantity (tinted by sign), price and (cost-viewers) value. */
@Composable
private fun StockRow(level: StockLevel, canCost: Boolean, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.gap), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(level.label, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                val sub = listOfNotNull(level.barcode, level.modelCode).joinToString(" · ")
                if (sub.isNotBlank()) {
                    Text(sub, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                }
                level.salePrice?.let {
                    Text(
                        "${t("catalog.unitPrice", null)}: ${formatMoney(it)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.muted,
                    )
                }
                if (canCost && level.averageCost != null) {
                    Text(
                        "${t("catalog.averageCost", null)}: ${formatMoney(level.averageCost)}" +
                            (level.value?.let { "  ·  ${t("catalog.stockValue", null)}: ${formatMoney(it)}" } ?: ""),
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.muted,
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                val qtyColor = when {
                    level.isBelowZero -> Tokens.danger
                    level.isZero -> Tokens.muted
                    else -> Tokens.text
                }
                Text(
                    level.quantity.toString(),
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily, color = qtyColor),
                )
                when {
                    level.isBelowZero -> StatusChip(t("catalog.belowZero", null), color = Tokens.danger)
                    level.isZero -> StatusChip(t("catalog.outOfStock", null), color = Tokens.muted)
                    else -> Text(t("catalog.onHand", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
            }
        }
    }
}
