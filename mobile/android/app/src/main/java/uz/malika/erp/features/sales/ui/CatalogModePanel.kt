package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.CatalogCard
import uz.malika.erp.features.sales.data.CatalogUnitItem
import uz.malika.erp.features.sales.lib.CardTap
import uz.malika.erp.features.sales.lib.resolveCardTap
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.features.sales.model.TillCatalogViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.TabChipItem
import uz.malika.erp.shared.ui.TabChips
import uz.malika.erp.ui.theme.Tokens

/** Clearance under the grid so the floating cart bar never hides the last row. */
private val GridBottomClearance = 88.dp

/**
 * The till's Catalog mode (ADR 0031): a search field, category chips and the
 * product grid. Tapping a card applies the tap rules (`lib/CardTap.kt`): a
 * quantity product goes straight into the cart, a single in-stock unit too, and
 * several units open the picker. Units already in the cart are never offered
 * again. The cart lives in [posVm], so switching modes keeps it.
 */
@Composable
fun CatalogModePanel(
    container: AppContainer,
    catalogVm: TillCatalogViewModel,
    posVm: PosViewModel,
    posState: PosState,
    online: Boolean,
    baseUrl: String,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val state by catalogVm.state.collectAsState()
    var picker by remember { mutableStateOf<Pair<String, List<CatalogUnitItem>>?>(null) }
    val cartCodes = remember(posState.lines) {
        posState.lines.filterIsInstance<CartLine.Unit>().map { it.key }.toSet()
    }

    LaunchedEffect(online) { catalogVm.start(online) }

    fun tapCard(card: CatalogCard) {
        if (card.isQuantity) {
            posVm.addProduct(card.toCartProduct())
            return
        }
        scope.launch {
            val units = runCatching { catalogVm.unitsFor(card.modelId, online) }.getOrDefault(emptyList())
            when (val tap = resolveCardTap(card, units, cartCodes)) {
                CardTap.AddQuantity -> posVm.addProduct(card.toCartProduct())
                is CardTap.AddUnit -> posVm.addUnitFromCatalog(tap.unit.code, online)
                is CardTap.PickUnit -> picker = card.label to tap.units
                CardTap.NoneAvailable -> container.toaster.info(t("catalog.noUnits", null))
            }
        }
    }

    Column(modifier.fillMaxSize()) {
        AppTextField(
            value = state.query,
            onValueChange = { catalogVm.setQuery(it, online) },
            placeholder = t("catalog.searchProducts", null),
            modifier = Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.screenH),
        )
        Spacer(Modifier.height(Tokens.Space.md))
        if (state.categories.isNotEmpty()) {
            val chips = buildList<TabChipItem<String?>> {
                add(TabChipItem(null, t("catalog.allProducts", null)))
                state.categories.forEach { add(TabChipItem(it.id, it.name)) }
            }
            TabChips(items = chips, selected = state.categoryId, onSelect = { catalogVm.setCategory(it, online) })
            Spacer(Modifier.height(Tokens.Space.md))
        }
        Box(Modifier.weight(1f).fillMaxWidth()) {
            when {
                state.loading && state.cards.isEmpty() -> Loading()
                state.errorKey != null -> ErrorView(
                    message = t(state.errorKey!!, null),
                    retryLabel = t("common.retry", null),
                    onRetry = { catalogVm.reload(online) },
                )
                state.cards.isEmpty() -> EmptyView(t("catalog.stockEmpty", null))
                else -> CatalogGrid(
                    cards = state.cards,
                    baseUrl = baseUrl,
                    onTap = ::tapCard,
                    contentPadding = PaddingValues(
                        start = Tokens.Space.screenH,
                        end = Tokens.Space.screenH,
                        bottom = GridBottomClearance,
                    ),
                )
            }
        }
    }

    picker?.let { (title, units) ->
        AppBottomSheet(onDismiss = { picker = null }) {
            UnitPickerSheet(title, units) { unit ->
                posVm.addUnitFromCatalog(unit.code, online)
                picker = null
            }
        }
    }
}
