package uz.malika.erp.features.stock.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.stock.data.StockLevel
import uz.malika.erp.features.stock.data.StockMovement
import uz.malika.erp.features.stock.data.StockRepository
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private const val PAGE_SIZE = 50

/**
 * One product's stock: its current level, the adjust actions (write-off / count
 * correction, with `stock.adjust`), and its paged movement log (ADR 0030). The
 * adjust forms layer over this sheet as a dialog; a successful adjustment calls
 * [onAdjusted] (refresh the list + close).
 */
@Composable
fun StockDetailSheet(
    level: StockLevel,
    repo: StockRepository,
    canCost: Boolean,
    canAdjust: Boolean,
    onAdjusted: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var page by remember(level.modelId) { mutableStateOf(PageState<StockMovement>()) }
    var loaded by remember(level.modelId) { mutableStateOf(false) }
    var error by remember(level.modelId) { mutableStateOf<String?>(null) }
    var adjustType by remember { mutableStateOf<String?>(null) }

    suspend fun load(p: Int) {
        page = page.copy(loading = true)
        error = null
        try {
            val res = repo.movements(level.modelId, p, PAGE_SIZE)
            page = page.append(res.items.map(StockMovement::fromDto), res.total, p)
        } catch (e: AppException) {
            page = page.copy(loading = false)
            error = e.message
        }
        loaded = true
    }

    LaunchedEffect(level.modelId) { load(1) }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(level.label, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        Text(
            t("catalog.pieces", mapOf("count" to level.quantity)),
            style = MaterialTheme.typography.titleMedium.copy(
                fontFamily = MonoFamily,
                color = if (level.quantity < 0) Tokens.danger else Tokens.text,
            ),
        )
        if (canCost && level.averageCost != null) {
            Spacer(Modifier.height(Tokens.Space.xs))
            Text(
                "${t("catalog.averageCost", null)}: ${formatMoney(level.averageCost)}" +
                    (level.value?.let { "  ·  ${t("catalog.stockValue", null)}: ${formatMoney(it)}" } ?: ""),
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.muted,
            )
        }

        if (canAdjust) {
            Spacer(Modifier.height(Tokens.Space.lg))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
                PillButton(t("catalog.writeOff", null), { adjustType = "WRITE_OFF" }, Modifier.weight(1f), ButtonVariant.OUTLINE)
                PillButton(t("catalog.countCorrection", null), { adjustType = "COUNT_CORRECTION" }, Modifier.weight(1f), ButtonVariant.OUTLINE)
            }
        }

        Spacer(Modifier.height(Tokens.Space.lg))
        Text(t("catalog.movements", null), style = MaterialTheme.typography.titleSmall, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        when {
            !loaded -> Loading()
            error != null -> ErrorView(error!!, retryLabel = t("common.retry", null), onRetry = { scope.launch { load(1) } })
            page.items.isEmpty() -> EmptyView(t("catalog.movementsEmpty", null))
            else -> {
                page.items.forEach { MovementRow(it, canCost) }
                LoadMoreFooter(page.hasMore, page.loading, onLoadMore = { scope.launch { load(page.nextPage) } })
            }
        }
    }

    adjustType?.let { type ->
        StockAdjustDialog(
            level = level,
            type = type,
            repo = repo,
            onClose = { adjustType = null },
            onSaved = { adjustType = null; onAdjusted() },
        )
    }
}

/** One movement line: localized type, signed pieces (tinted), optional cost + note, when, who. */
@Composable
private fun MovementRow(m: StockMovement, canCost: Boolean) {
    val t = LocalT.current
    val label = movementLabel(m.typeCode, m.typeLabel, t)
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(label, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                val meta = listOfNotNull(m.occurredAt?.let(::formatDateTime), m.byName).joinToString(" · ")
                if (meta.isNotBlank()) Text(meta, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                m.note?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    (if (m.quantity > 0) "+${m.quantity}" else m.quantity.toString()),
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontFamily = MonoFamily,
                        color = if (m.quantity < 0) Tokens.danger else Tokens.success,
                    ),
                )
                if (canCost) m.unitCost?.let {
                    Text(formatMoney(it), style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                }
            }
        }
        HorizontalDivider(color = Tokens.border)
    }
}

/** Localised movement label by type code, falling back to the server label. */
private fun movementLabel(code: String, serverLabel: String, t: uz.malika.erp.i18n.Translate): String = when (code) {
    "PURCHASE" -> t("catalog.movePurchase", null)
    "SALE" -> t("catalog.moveSale", null)
    "RETURN" -> t("catalog.moveReturn", null)
    "WRITE_OFF" -> t("catalog.moveWriteOff", null)
    "COUNT_CORRECTION" -> t("catalog.moveCount", null)
    else -> serverLabel.ifBlank { code }
}
