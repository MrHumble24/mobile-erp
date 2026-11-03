package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.ui.theme.Tokens

/** Devices awaiting inspection; tap a row to grade it. Paginated (load-more). */
@Composable
fun QcQueueTab(
    queue: PageState<DeviceRowDto>,
    modelNames: Map<String, String>,
    onLoadMore: () -> Unit,
    onGrade: (String) -> Unit,
) {
    val t = LocalT.current
    if (queue.items.isEmpty() && !queue.loading) {
        EmptyView(t("qc.queueEmpty", null))
        return
    }
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(queue.items, key = { it.id }) { d ->
            AppCard(onClick = { onGrade(d.imei) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        ImeiText(d.imei, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            (modelNames[d.modelId] ?: d.modelId) + " · " + t(DeviceStatusMeta.labelKey(d.statusCode), null),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.ash)
                }
            }
        }
        item { LoadMoreFooter(hasMore = queue.hasMore, loading = queue.loading, onLoadMore = onLoadMore) }
    }
}
