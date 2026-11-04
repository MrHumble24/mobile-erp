package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.data.LookupDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Manage QC grades and defect types. Active/all toggle lives in the filter sheet. */
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
    var showFilters by remember { mutableStateOf(false) }
    Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            FilterButton(
                activeCount = if (includeInactive) 1 else 0,
                onClick = { showFilters = true },
            )
        }
        Spacer(Modifier.height(Tokens.Space.xs))
        LookupSection(t("qc.grades", null), "grades", grades, canManage, onAdd, onEdit)
        Spacer(Modifier.height(Tokens.Space.gutter))
        LookupSection(t("qc.defectTypes", null), "defect-types", defects, canManage, onAdd, onEdit)
    }

    if (showFilters) {
        QcLookupsFilterSheet(
            includeInactive = includeInactive,
            onToggleInactive = onToggleInactive,
            onReset = { onToggleInactive(false) },
            onDismiss = { showFilters = false },
        )
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
        Text(title, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        if (canManage) {
            PillButton(t("common.add", null), { onAdd(kind) }, variant = ButtonVariant.SECONDARY)
        }
    }
    Spacer(Modifier.height(Tokens.Space.md))
    AppCard(Modifier.fillMaxWidth(), padding = PaddingValues(horizontal = Tokens.Space.cardPad)) {
        if (rows.isEmpty()) {
            Text(
                t("common.notFound", null),
                style = MaterialTheme.typography.bodyMedium,
                color = Tokens.muted,
                modifier = Modifier.padding(vertical = Tokens.Space.lg),
            )
        } else {
            rows.forEachIndexed { i, row ->
                LookupRow(kind, row, canManage, onEdit)
                if (i < rows.lastIndex) HorizontalDivider(color = Tokens.border)
            }
        }
    }
}

/** Label + mono code; inactive rows carry a sold-grey pill. Tap to edit (managers). */
@Composable
private fun LookupRow(kind: String, row: LookupDto, canManage: Boolean, onEdit: (String, LookupDto) -> Unit) {
    val t = LocalT.current
    Row(
        Modifier.fillMaxWidth()
            .let { if (canManage) it.clickable { onEdit(kind, row) } else it }
            .heightIn(min = Tokens.minTouch)
            .padding(vertical = Tokens.Space.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(row.label, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            Text(row.code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
        }
        if (!row.isActive) {
            StatusChip(label = t("common.no", null), color = Tokens.sold)
        }
    }
}
