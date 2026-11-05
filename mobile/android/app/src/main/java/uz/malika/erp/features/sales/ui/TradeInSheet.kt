package uz.malika.erp.features.sales.ui

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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.AppContainer
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.InventoryApi
import uz.malika.erp.features.purchases.model.UsedUnitState
import uz.malika.erp.features.purchases.ui.UsedUnitFields
import uz.malika.erp.features.sales.model.TradeInDraft
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Add one traded-in phone (ADR 0039): the same unit fields as a purchase + its agreed value. */
@Composable
fun TradeInSheet(container: AppContainer, onAdd: (TradeInDraft) -> Unit, onDismiss: () -> Unit) {
    val t = LocalT.current
    val catalog = remember { CatalogRepository(container.retrofit.create(InventoryApi::class.java)) }
    val models by produceState(emptyList<DeviceModelView>()) { value = runCatching { catalog.list() }.getOrDefault(emptyList()) }
    val unit = remember { UsedUnitState() }
    var value by remember { mutableStateOf("") }

    val valueNum = parseMoney(value)
    val ready = unit.ready() && valueNum.signum() > 0

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(t("purchases.tradeInAdd", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(t("purchases.tradeInHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))

        UsedUnitFields(state = unit, models = models)
        Spacer(Modifier.height(Tokens.Space.lg))
        AppFormField(
            label = t("purchases.tradeInValue", null),
            value = value,
            onValueChange = { value = it },
            keyboardType = KeyboardType.Decimal,
        )
        Spacer(Modifier.height(Tokens.Space.lg))
        PillButton(
            text = t("purchases.tradeInAdd", null),
            onClick = { onAdd(TradeInDraft.from(unit, valueNum)); onDismiss() },
            modifier = Modifier.fillMaxWidth(),
            enabled = ready,
        )
        Spacer(Modifier.height(Tokens.Space.md))
    }
}
