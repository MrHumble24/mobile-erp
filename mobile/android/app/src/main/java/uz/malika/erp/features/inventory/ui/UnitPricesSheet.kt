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
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * A unit's own per-level prices (ADR 0034): empty means "use the product price".
 * Shows the resolved list price under each field so the owner sees the effect.
 * Online-only; `price.manage`-gated by the caller.
 */
@Composable
fun UnitPricesSheet(
    deviceId: String,
    resolvedPrices: Map<String, String?>?,
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

    LaunchedEffect(deviceId) {
        try {
            val dto = repo.getUnit(deviceId)
            values.clear()
            dto.prices.forEach { p -> values[p.levelCode] = p.price ?: "" }
        } catch (_: Exception) {
            // No own prices yet — start blank.
        } finally {
            loading = false
        }
    }

    fun save() {
        saving = true; error = null
        scope.launch {
            try {
                val cells = PriceLevel.ALL.associateWith { level ->
                    values[level]?.trim()?.takeIf { it.isNotEmpty() }?.toBigDecimalOrNull()
                }
                repo.setUnit(deviceId, cells)
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
        Text(t("pricing.unitPrices", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(t("pricing.unitPricesHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        if (!online) Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
        if (loading) {
            Loading()
        } else {
            PriceLevel.ALL.forEach { level ->
                AppFormField(
                    label = t(PriceLevel.labelKey(level), null),
                    value = values[level] ?: "",
                    onValueChange = { values[level] = it },
                    keyboardType = KeyboardType.Decimal,
                )
                val resolved = resolvedPrices?.get(level)
                Text(
                    if (resolved != null) "${t("pricing.listPrice", null)}: ${formatMoney(resolved)}" else t("pricing.noPrice", null),
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
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
