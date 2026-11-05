package uz.malika.erp.features.purchases.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.features.purchases.model.BuyPhoneViewModel
import uz.malika.erp.features.purchases.model.UsedUnitState
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.ui.CustomerPicker
import uz.malika.erp.features.sales.ui.CustomerSelection
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.AccountPicker
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens
import uz.malika.erp.AppContainer

/**
 * Buy a used phone from a seller (ADR 0039): seller (existing customer or
 * name + phone), the model + its attributes + IMEI/serial, the price paid and
 * the account the money leaves. No passport/ID field anywhere — by design. The
 * unit lands in stock and `CUSTOMER_PURCHASE` posts the money out. Online only.
 */
@Composable
fun BuyPhoneSheet(
    container: AppContainer,
    vm: BuyPhoneViewModel,
    online: Boolean,
    onBought: () -> Unit,
) {
    val t = LocalT.current
    val state by vm.state.collectAsState()
    val unit = remember { UsedUnitState() }
    val lookupRepo = remember { CustomersRepository(container.retrofit.create(uz.malika.erp.features.sales.data.SalesApi::class.java)) }
    val accounts by rememberAccountOptions(container)

    var seller by remember { mutableStateOf(CustomerSelection()) }
    var price by remember { mutableStateOf("") }
    var account by remember { mutableStateOf("CASH") }

    LaunchedEffect(state.result) { if (state.result != null) onBought() }

    val priceNum = parseMoney(price)
    val sellerChosen = !seller.customerId.isNullOrBlank() || !seller.newName.isNullOrBlank()
    val ready = online && !state.submitting && sellerChosen && unit.ready() && priceNum.signum() > 0

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(t("purchases.buyTitle", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(t("purchases.buyHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))

        Text(t("purchases.seller", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        CustomerPicker(selection = seller, onChange = { seller = it }, lookup = { lookupRepo.lookup(it) }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.lg))

        UsedUnitFields(state = unit, models = state.models, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.lg))

        AppFormField(
            label = t("purchases.pricePaid", null),
            value = price,
            onValueChange = { price = it },
            keyboardType = KeyboardType.Decimal,
            enabled = !state.submitting,
        )
        Spacer(Modifier.height(Tokens.Space.md))
        AccountPicker(label = t("purchases.account", null), selected = account, options = accounts, onSelect = { account = it }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.lg))

        if (!online) Text(t("purchases.tradeInOffline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        state.errorKey?.let { Text(t(it, null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
        state.errorText?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
        if (state.needsShift) Text(t("shifts.shiftRequired", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        Spacer(Modifier.height(Tokens.Space.sm))

        PillButton(
            text = if (state.submitting) t("common.loading", null) else t("purchases.buyTitle", null),
            onClick = {
                val sellerId = seller.customerId?.takeIf { it.isNotBlank() }
                val body = buildJsonObject {
                    if (sellerId != null) {
                        put("customerId", sellerId)
                    } else {
                        put(
                            "customer",
                            buildJsonObject {
                                put("name", (seller.newName ?: "").trim())
                                seller.newPhone?.trim()?.takeIf { it.isNotEmpty() }?.let { put("phone", it) }
                            },
                        )
                    }
                    unit.appendUnit(this)
                    put("pricePaid", JsonPrimitive(priceNum))
                    put("accountCode", account)
                }
                vm.submit(body)
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = ready,
        )
        Spacer(Modifier.height(Tokens.Space.md))
    }
}
