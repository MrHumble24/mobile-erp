package uz.malika.erp.features.customs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.customs.data.PriceListVersionDto
import uz.malika.erp.features.customs.data.UnmatchedModelDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Every price-list version, newest first: effective date, note, item count. */
@Composable
fun VersionsSection(rows: List<PriceListVersionDto>) {
    val t = LocalT.current
    if (rows.isEmpty()) {
        EmptyView(t("customs.emptyList", null), compact = true)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
        rows.forEach { v ->
            AppCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            v.effectiveAt.take(10),
                            style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
                            color = Tokens.text,
                        )
                        v.note?.takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                        }
                    }
                    Text(
                        t("customs.itemCount", mapOf("count" to v.itemCount)),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Tokens.muted,
                    )
                }
            }
        }
    }
}

/** Models that cannot be stamped a customs fee, with the reason. */
@Composable
fun UnmatchedSection(rows: List<UnmatchedModelDto>) {
    val t = LocalT.current
    if (rows.isEmpty()) {
        EmptyView(t("customs.unmatchedEmpty", null), compact = true)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
        rows.forEach { m ->
            AppCard(Modifier.fillMaxWidth()) {
                Text("${m.brand} ${m.name}", style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                m.customsCode?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                        color = Tokens.muted,
                    )
                }
                Spacer(Modifier.height(Tokens.Space.rowV))
                val reasonKey = if (m.reason == "MISSING_CODE") "customs.reasonMissingCode" else "customs.reasonNotInList"
                StatusChip(label = t(reasonKey, null), color = Tokens.warning)
            }
        }
    }
}
