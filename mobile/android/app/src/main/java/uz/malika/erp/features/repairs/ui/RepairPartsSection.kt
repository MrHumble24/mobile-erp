package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.AppContainer
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.InventoryApi
import uz.malika.erp.features.inventory.data.ProductKind
import uz.malika.erp.features.repairs.data.RepairPartDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Parts taken out of stock for a ticket (ADR 0040): the list + an add/remove when `repair.manage`. */
@Composable
fun RepairPartsSection(
    container: AppContainer,
    parts: List<RepairPartDto>,
    canManage: Boolean,
    enabled: Boolean,
    onAdd: (modelId: String, quantity: Int) -> Unit,
    onRemove: (partId: String) -> Unit,
) {
    val t = LocalT.current
    var addOpen by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth()) {
        Text(t("repairs.parts", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        if (parts.isEmpty()) {
            Text(t("repairs.noParts", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        } else {
            parts.forEach { part ->
                AppCard(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("${part.name} × ${part.quantity}", style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                            part.partLineCost?.let { MoneyText(it, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily, color = Tokens.muted)) }
                        }
                        if (canManage) {
                            IconButton(onClick = { onRemove(part.id) }, enabled = enabled) {
                                Icon(Icons.Outlined.Close, contentDescription = t("common.close", null), tint = Tokens.slate)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(Tokens.Space.rowV))
            }
        }
        if (canManage) {
            Spacer(Modifier.height(Tokens.Space.rowV))
            PillButton(t("repairs.addPart", null), { addOpen = true }, Modifier.fillMaxWidth(), variant = ButtonVariant.OUTLINE, enabled = enabled)
        }
    }

    if (addOpen) {
        AppBottomSheet(onDismiss = { addOpen = false }) {
            AddPartSheet(container, onAdd = { modelId, qty -> onAdd(modelId, qty); addOpen = false })
        }
    }
}

/** Pick a quantity product + a count to take out of stock for the repair. */
@Composable
private fun AddPartSheet(container: AppContainer, onAdd: (modelId: String, quantity: Int) -> Unit) {
    val t = LocalT.current
    val catalog = remember { CatalogRepository(container.retrofit.create(InventoryApi::class.java)) }
    val products by produceState(emptyList<DeviceModelView>()) {
        value = runCatching { catalog.list().filter { it.kind == ProductKind.QUANTITY } }.getOrDefault(emptyList())
    }
    var product by remember { mutableStateOf<DeviceModelView?>(null) }
    var qty by remember { mutableStateOf("1") }
    val quantity = qty.trim().toIntOrNull() ?: 0
    val ready = product != null && quantity > 0

    Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter)) {
        Text(t("repairs.addPart", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.lg))
        AppSelect(value = product, options = products, optionLabel = { it.label }, onSelect = { product = it }, label = t("repairs.part", null))
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.quantity", null), qty, { qty = it }, keyboardType = KeyboardType.Number)
        Spacer(Modifier.height(Tokens.Space.lg))
        PillButton(t("repairs.addPart", null), { product?.let { onAdd(it.id, quantity) } }, Modifier.fillMaxWidth(), enabled = ready)
        Spacer(Modifier.height(Tokens.Space.md))
    }
}
