package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.QcInspectionDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Past inspections, newest first. */
@Composable
fun QcInspectionsTab(items: List<QcInspectionDto>) {
    val t = LocalT.current
    if (items.isEmpty()) {
        EmptyView(t("qc.queueEmpty", null))
        return
    }
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(items, key = { it.id }) { item ->
            val subtitle = listOf(
                item.modelLabel,
                item.gradeCode?.let { "${t("qc.grade", null)}: $it" } ?: "",
                item.inspectorName,
            ).filter { it.isNotBlank() }.joinToString(" · ")
            AppCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        ImeiText(item.imei, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(4.dp))
                        Text(subtitle, style = MaterialTheme.typography.bodySmall)
                    }
                    StatusChip(
                        label = t(if (item.passed) "qc.passed" else "qc.failed", null),
                        color = if (item.passed) Tokens.success else Tokens.danger,
                    )
                }
            }
        }
    }
}
