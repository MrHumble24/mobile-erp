package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Devices awaiting inspection as cards (model, mono IMEI, status pill); tap a
 * row to grade it. Paginated (load-more). [footer] renders after the list —
 * the manager's reference-data link.
 */
@Composable
fun QcQueueTab(
    queue: PageState<DeviceRowDto>,
    modelNames: Map<String, String>,
    onLoadMore: () -> Unit,
    onGrade: (String) -> Unit,
    footer: @Composable () -> Unit = {},
) {
    val t = LocalT.current
    LazyColumn(
        contentPadding = PaddingValues(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.md),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        if (queue.items.isEmpty() && !queue.loading) {
            item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("qc.queueEmpty", null), compact = true) } }
        } else {
            items(queue.items, key = { it.id }) { d ->
                AppCard(Modifier.fillMaxWidth(), onClick = { onGrade(d.code) }) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(modelNames[d.modelId] ?: d.modelId, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                            Text(d.code, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                        }
                        Spacer(Modifier.width(Tokens.Space.gap))
                        StatusChip(t(DeviceStatusMeta.labelKey(d.statusCode), null), color = DeviceStatusMeta.color(d.statusCode))
                    }
                }
            }
            item { LoadMoreFooter(hasMore = queue.hasMore, loading = queue.loading, onLoadMore = onLoadMore) }
        }
        item { footer() }
    }
}
