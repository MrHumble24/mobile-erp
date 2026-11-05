package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.data.CatalogUnitItem
import uz.malika.erp.features.sales.lib.Pricing
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Picks one in-stock unit after a seller taps an IMEI/SERIAL card that has more
 * than one unit left (ADR 0031). Each row: code, storage · colour, grade and
 * price. Rendered inside the panel's bottom sheet; tapping a row adds it.
 */
@Composable
fun UnitPickerSheet(
    title: String,
    units: List<CatalogUnitItem>,
    level: String,
    onPick: (CatalogUnitItem) -> Unit,
) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter)) {
        Text(t("catalog.pickUnit", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.xs))
        Text(title, style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.lg))
        units.forEach { unit ->
            UnitRow(unit, level, t) { onPick(unit) }
            Spacer(Modifier.height(Tokens.Space.rowV))
        }
    }
}

@Composable
private fun UnitRow(unit: CatalogUnitItem, level: String, t: Translate, onClick: () -> Unit) {
    AppCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    unit.code,
                    style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
                    color = Tokens.text,
                )
                val sub = listOfNotNull(
                    unit.storage,
                    unit.color,
                    unit.gradeCode?.let { "${t("catalog.grade", null)} $it" },
                ).joinToString(" · ")
                if (sub.isNotBlank()) {
                    Text(sub, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
            }
            val price = Pricing.levelPrice(unit.prices, level)?.toPlainString() ?: unit.targetPrice
            price?.takeIf { it.isNotBlank() }?.let {
                Text(
                    formatMoney(it),
                    style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
                    color = Tokens.text,
                )
            }
        }
    }
}
