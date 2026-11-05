package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.credit.ui.OnCreditSheet
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.features.sales.model.addTradeIn
import uz.malika.erp.features.sales.model.checkoutWithTradeIns
import uz.malika.erp.features.sales.model.removeTradeIn
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.PaymentMethodField
import uz.malika.erp.shared.payments.ui.PaymentSelection
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens
import java.math.BigDecimal

/**
 * Cart-level checkout (ADR 0034): the price level (follows the customer, seller
 * may switch), an optional customer, a whole-cart discount, shared notes, the
 * totals and the submit. Submitting fans the priced cart into one `sale.create`
 * per line via [PosViewModel.checkout].
 */
@Composable
fun PosCheckoutForm(
    container: AppContainer,
    vm: PosViewModel,
    state: PosState,
    online: Boolean,
    api: SalesApi,
    shiftBlocked: Boolean = false,
    onOpenShift: () -> Unit = {},
) {
    val t = LocalT.current
    val busy = state.busy

    var notes by remember { mutableStateOf("") }
    var customer by remember { mutableStateOf(CustomerSelection()) }
    var payment by remember { mutableStateOf(PaymentSelection()) }
    var creditOpen by remember { mutableStateOf(false) }
    var tradeInOpen by remember { mutableStateOf(false) }
    val canCredit = LocalCan.current("sale.credit")
    val lookupRepo = remember { CustomersRepository(api) }
    val accounts by rememberAccountOptions(container)

    // The chosen customer drives the level + standing discount (seller can still change both).
    LaunchedEffect(customer.customerId, customer.priceLevelCode, customer.standingDiscountPercent) {
        vm.applyCustomer(customer.priceLevelCode, parseMoney(customer.standingDiscountPercent))
    }

    val priced = state.priced
    val hasTradeIns = state.tradeIns.isNotEmpty()
    val customerChosen = !customer.customerId.isNullOrBlank() || !customer.newName.isNullOrBlank()
    // With trade-ins the customer pays the reduced amount; otherwise the full payable.
    val total = if (hasTradeIns) state.amountToPay else priced.totals.payable
    val pricesValid = priced.lines.isNotEmpty() && !priced.hasRejection && priced.lines.all { it.finalPrice > BigDecimal.ZERO }
    val payValid = payment.valid(total, accounts)
    val tradeInOk = !hasTradeIns || (customerChosen && state.tradeInPlan.ok)

    Column(Modifier.fillMaxWidth()) {
        LevelControl(level = state.level, onSelect = vm::setLevel)
        Spacer(Modifier.height(16.dp))
        CustomerPicker(
            selection = customer,
            onChange = { customer = it },
            lookup = { lookupRepo.lookup(it) },
            enabled = !busy,
        )
        Spacer(Modifier.height(16.dp))
        CartDiscountControl(
            settings = state.settings,
            current = state.cartDiscount,
            enabled = !busy,
            onChange = vm::setCartDiscount,
        )
        Spacer(Modifier.height(12.dp))
        TradeInSection(
            state = state,
            online = online,
            customerChosen = customerChosen,
            onOpenAdd = { tradeInOpen = true },
            onRemove = vm::removeTradeIn,
        )
        Spacer(Modifier.height(12.dp))
        AppFormField(label = t("pos.notes", null), value = notes, onValueChange = { notes = it }, enabled = !busy)
        Spacer(Modifier.height(16.dp))
        PaymentMethodField(selection = payment, onSelection = { payment = it }, accounts = accounts, total = total, enabled = !busy)
        Spacer(Modifier.height(16.dp))
        CartTotalsView(priced.totals)
        Spacer(Modifier.height(16.dp))
        if (shiftBlocked) {
            Text(t("shifts.shiftRequired", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
            Spacer(Modifier.height(8.dp))
            PillButton(t("shifts.openShift", null), onOpenShift, Modifier.fillMaxWidth(), variant = ButtonVariant.OUTLINE)
            Spacer(Modifier.height(8.dp))
        }
        PillButton(
            text = if (busy) t("pos.completingSale", null) else t("pos.checkoutButton", null),
            onClick = {
                val parts = payment.parts(total, accounts)
                if (hasTradeIns) {
                    vm.checkoutWithTradeIns(online, customer.customerId, customer.newName, customer.newPhone, notes.trim(), parts)
                } else {
                    vm.checkout(online, customer.customerId, customer.newName, customer.newPhone, notes.trim(), parts)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !busy && pricesValid && payValid && tradeInOk && !shiftBlocked,
        )
        // "On credit" is never offered with a trade-in (ADR 0039).
        if (state.creditEnabled && canCredit && !hasTradeIns) {
            Spacer(Modifier.height(12.dp))
            if (!online) Text(t("credit.errorOffline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
            PillButton(
                text = t("credit.payOnCredit", null),
                onClick = { creditOpen = true },
                modifier = Modifier.fillMaxWidth(),
                variant = ButtonVariant.OUTLINE,
                enabled = online && !busy && pricesValid && !shiftBlocked,
            )
        }
    }

    if (creditOpen) {
        AppBottomSheet(onDismiss = { creditOpen = false }) {
            OnCreditSheet(
                container = container,
                priced = priced,
                level = state.level,
                customerId = customer.customerId,
                onSold = { vm.resetCart() },
                onDismiss = { creditOpen = false },
            )
        }
    }

    if (tradeInOpen) {
        AppBottomSheet(onDismiss = { tradeInOpen = false }) {
            TradeInSheet(container = container, onAdd = vm::addTradeIn, onDismiss = { tradeInOpen = false })
        }
    }
}
