package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.features.sales.data.CartProduct
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.features.sales.model.removeLine
import uz.malika.erp.features.sales.model.setLineDiscount
import uz.malika.erp.features.sales.model.setLinePrice
import uz.malika.erp.features.sales.model.setLineQuantity
import uz.malika.erp.features.sales.model.setLineWarranty
import uz.malika.erp.features.sales.model.toggleOverride
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.ui.theme.Tokens

/**
 * Scan mode (today's till): scan/type a code into a multi-line cart, then
 * checkout inline. Catalog mode feeds the same cart (ADR 0031), so this stays
 * exactly as it was. The product-match sheet (a typed name resolving to quantity
 * products) belongs to this mode only.
 */
@Composable
fun ScanModePanel(
    container: AppContainer,
    vm: PosViewModel,
    state: PosState,
    online: Boolean,
    api: SalesApi,
    shiftBlocked: Boolean = false,
    onOpenShift: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        ScannerField(onScan = { code, _ -> vm.scan(code, online) }, placeholder = t("pos.scanPrompt", null))
        state.errorKey?.let {
            Spacer(Modifier.height(8.dp))
            Text(t(it, null), style = MaterialTheme.typography.bodyMedium, color = Tokens.destructive)
        }
        Spacer(Modifier.height(16.dp))
        when {
            state.busy && state.lines.isEmpty() ->
                Box(Modifier.fillMaxWidth().height(120.dp)) { Loading() }
            state.lines.isEmpty() ->
                EmptyView(t("pos.cartEmpty", null), Modifier.height(220.dp), icon = Icons.Outlined.QrCodeScanner)
            else -> {
                PosCartList(
                    priced = state.priced,
                    settings = state.settings,
                    cartDiscountActive = state.cartDiscount != null,
                    canOverride = state.canOverride,
                    actions = CartActions(
                        onPrice = vm::setLinePrice,
                        onWarranty = vm::setLineWarranty,
                        onQuantity = vm::setLineQuantity,
                        onRemove = vm::removeLine,
                        onLineDiscount = vm::setLineDiscount,
                        onToggleOverride = vm::toggleOverride,
                    ),
                    enabled = !state.busy,
                )
                Spacer(Modifier.height(16.dp))
                PosCheckoutForm(container, vm, state, online, api, shiftBlocked, onOpenShift)
            }
        }
    }
}

/** Quantity products matched by a typed name search (ADR 0030) — tap one to add it. */
@Composable
fun ProductPickSheet(
    matches: List<CartProduct>,
    onPick: (CartProduct) -> Unit,
) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        Text(t("catalog.addToCart", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(12.dp))
        matches.forEach { product ->
            PillButton(
                text = "${product.label} · ${t("catalog.pieces", mapOf("count" to product.inStock))}",
                onClick = { onPick(product) },
                modifier = Modifier.fillMaxWidth(),
                variant = ButtonVariant.OUTLINE,
            )
            Spacer(Modifier.height(8.dp))
        }
    }
}
