package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.AppContainer
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.ui.theme.Tokens

/**
 * The cart + checkout, shown in a bottom sheet from the Catalog-mode cart bar
 * (ADR 0031). Reuses the exact cart and checkout of Scan mode ([PosCartList],
 * [PosCheckoutForm]) so both modes feed one cart and one checkout.
 */
@Composable
fun CartSheet(
    container: AppContainer,
    vm: PosViewModel,
    state: PosState,
    online: Boolean,
    api: SalesApi,
) {
    Column(
        Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
    ) {
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
        Spacer(Modifier.height(Tokens.Space.lg))
        PosCheckoutForm(container, vm, state, online, api)
        Spacer(Modifier.height(Tokens.Space.lg))
    }
}
