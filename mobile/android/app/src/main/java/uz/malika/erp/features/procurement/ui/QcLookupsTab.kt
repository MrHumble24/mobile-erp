package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.LookupDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Manage QC grades and defect types. Writes need `settings.manage`. */
@Composable
fun QcLookupsTab(
    grades: List<LookupDto>,
    defects: List<LookupDto>,
    includeInactive: Boolean,
    canManage: Boolean,
    onToggleInactive: (Boolean) -> Unit,
    onAdd: (String) -> Unit,
    onEdit: (String, LookupDto) -> Unit,
) {
    val t = LocalT.current
    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text(t("qc.active", null), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(6.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption(false, t("qc.active", null)),
                SegmentOption(true, t("common.all", null)),
            ),
            selected = includeInactive,
            onSelect = onToggleInactive,
        )
        Spacer(Modifier.height(20.dp))
        LookupSection(t("qc.grades", null), "grades", grades, canManage, onAdd, onEdit)
        Spacer(Modifier.height(20.dp))
        LookupSection(t("qc.defectTypes", null), "defect-types", defects, canManage, onAdd, onEdit)
    }
}

@Composable
private fun LookupSection(
    title: String,
    kind: String,
    rows: List<LookupDto>,
    canManage: Boolean,
    onAdd: (String) -> Unit,
    onEdit: (String, LookupDto) -> Unit,
) {
    val t = LocalT.current
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        if (canManage) {
            PillButton(t("common.add", null), { onAdd(kind) }, variant = ButtonVariant.GHOST)
        }
    }
    Spacer(Modifier.height(8.dp))
    if (rows.isEmpty()) {
        Text(t("common.notFound", null), style = MaterialTheme.typography.bodySmall)
    } else {
        rows.forEach { row ->
            LookupRow(kind, row, canManage, onEdit)
        }
    }
}

@Composable
private fun LookupRow(kind: String, row: LookupDto, canManage: Boolean, onEdit: (String, LookupDto) -> Unit) {
    val t = LocalT.current
    Row(
        Modifier.fillMaxWidth()
            .let { if (canManage) it.clickable { onEdit(kind, row) } else it }
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(row.label, style = MaterialTheme.typography.bodyMedium)
            ImeiText(row.code, style = MaterialTheme.typography.bodySmall)
        }
        if (!row.isActive) {
            StatusChip(label = t("common.no", null), color = Tokens.ash)
        }
    }
}
