package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.PricingRepository
import uz.malika.erp.features.inventory.data.ProductPriceCell
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

private const val ANY = ""
private fun cellKey(storage: String, level: String) = "$storage|$level"

/**
 * Product price editor (ADR 0034): a storage × level grid with an "any storage"
 * row, saved in one PUT. A QUANTITY product has only the any-storage row.
 * Online-only; `price.manage`-gated by the caller.
 */
@Composable
fun ProductPricesSheet(
    modelId: String,
    isQuantity: Boolean,
    storageOptions: List<String>,
    repo: PricingRepository,
    online: Boolean,
    onToast: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val values = remember { mutableStateMapOf<String, String>() }
    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val rows = remember(isQuantity, storageOptions) {
        if (isQuantity) listOf(ANY) else storageOptions + ANY
    }

    LaunchedEffect(modelId) {
        try {
            val dto = repo.getProduct(modelId)
            values.clear()
            dto.prices.forEach { p -> values[cellKey(p.storage ?: ANY, p.levelCode)] = p.price ?: "" }
        } catch (_: Exception) {
            // Empty grid is a valid starting point (no prices yet).
        } finally {
            loading = false
        }
    }

    fun save() {
        saving = true; error = null
        scope.launch {
            try {
                val cells = rows.flatMap { storage ->
                    PriceLevel.ALL.map { level ->
                        ProductPriceCell(
                            storage = storage.takeIf { it != ANY },
                            levelCode = level,
                            price = values[cellKey(storage, level)]?.trim()?.takeIf { it.isNotEmpty() }?.toBigDecimalOrNull(),
                        )
                    }
                }
                repo.setProduct(modelId, cells)
                onToast(t("pricing.pricesSaved", null))
                onDismiss()
            } catch (e: AppException) {
                saving = false; error = e.message
            }
        }
    }

    Column(
        Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
    ) {
        Text(t("pricing.productPrices", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(t("pricing.productPricesHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        if (!online) Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        if (loading) {
            Loading()
        } else {
            rows.forEach { storage ->
                PriceRowCard(
                    label = if (storage == ANY) t("pricing.anyStorage", null) else storage,
                    storage = storage,
                    values = values,
                )
            }
            error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(
                text = if (saving) t("common.loading", null) else t("common.save", null),
                onClick = { save() },
                enabled = online && !saving,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun PriceRowCard(
    label: String,
    storage: String,
    values: androidx.compose.runtime.snapshots.SnapshotStateMap<String, String>,
) {
    val t = LocalT.current
    AppCard {
        Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
            Text(label, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
            PriceLevel.ALL.forEach { level ->
                val key = cellKey(storage, level)
                AppFormField(
                    label = t(PriceLevel.labelKey(level), null),
                    value = values[key] ?: "",
                    onValueChange = { values[key] = it },
                    keyboardType = KeyboardType.Decimal,
                )
            }
        }
    }
}
