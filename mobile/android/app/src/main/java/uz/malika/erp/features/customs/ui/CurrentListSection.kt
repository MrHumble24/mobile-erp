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
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import uz.malika.erp.features.customs.data.CurrentItemDto
import uz.malika.erp.features.customs.data.CurrentListDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** The current price list: one card per code with fee, previous fee and markers. */
@Composable
fun CurrentListSection(list: CurrentListDto?) {
    val t = LocalT.current
    if (list == null) {
        EmptyView(t("customs.emptyList", null), compact = true)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
        Text(
            "${t("customs.effectiveAt", null)}: ${list.effectiveAt.take(10)}",
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.muted,
        )
        list.items.forEach { CurrentItemCard(it) }
    }
}

@Composable
private fun CurrentItemCard(item: CurrentItemDto) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    item.customsCode,
                    style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
                    color = Tokens.text,
                )
                item.description?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
            }
            MoneyText(item.fee, style = MaterialTheme.typography.titleSmall)
        }
        Spacer(Modifier.height(Tokens.Space.rowV))
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            val (changeKey, changeColor) = changeMarker(item.fee, item.previousFee)
            StatusChip(label = t(changeKey, null), color = changeColor)
            item.previousFee?.let {
                Row {
                    Text(
                        "${t("customs.previousFee", null)}: ",
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.muted,
                    )
                    MoneyText(it, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.muted))
                }
            }
            Spacer(Modifier.weight(1f))
            StatusChip(
                label = t(if (item.usedByModel) "customs.usedByModel" else "customs.notUsed", null),
                color = if (item.usedByModel) Tokens.success else Tokens.sold,
            )
        }
    }
}

/** Up / down / same / new marker for a fee against its previous version's fee. */
@Composable
private fun changeMarker(fee: String, previousFee: String?): Pair<String, Color> {
    if (previousFee == null) return "customs.newItem" to Tokens.warning
    val now = parseMoney(fee)
    val was = parseMoney(previousFee)
    return when {
        now > was -> "customs.wentUp" to Tokens.danger
        now < was -> "customs.wentDown" to Tokens.success
        else -> "customs.unchanged" to Tokens.sold
    }
}
