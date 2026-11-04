package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.nasiya.model.creditUsedFraction
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Slice-local Warm Card pieces: the partner credit bar, the consignment status
 * hue + label, keyed fact rows, the surface-2 subject block that heads every
 * write sheet, and the action-sheet error line.
 */

/** Outstanding-vs-limit bar; shows "unlimited" when the partner has no limit. */
@Composable
fun CreditBar(creditLimit: String, outstanding: String, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val fraction = creditUsedFraction(creditLimit, outstanding)
    if (fraction == null) {
        Text(t("partners.creditUnlimited", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        return
    }
    val color = when {
        fraction >= 0.9f -> Tokens.danger
        fraction >= 0.7f -> Tokens.warning
        else -> Tokens.success
    }
    Column(modifier) {
        Row(Modifier.fillMaxWidth()) {
            MoneyText(outstanding, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.muted))
            Spacer(Modifier.weight(1f))
            MoneyText(creditLimit, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.muted))
        }
        Spacer(Modifier.height(Tokens.Space.xs))
        Box(Modifier.fillMaxWidth().height(6.dp).background(Tokens.border, RoundedCornerShape(100))) {
            Box(Modifier.fillMaxWidth(fraction).height(6.dp).background(color, RoundedCornerShape(100)))
        }
    }
}

/** Status hue for a consignment status code (one meaning per hue, DESIGN.md). */
@Composable
fun consignmentStatusColor(code: String): Color = when (code) {
    "OUT" -> Tokens.info
    "SETTLED" -> Tokens.success
    "RETURNED" -> Tokens.sold
    else -> Tokens.muted
}

/** Translated status label; unknown codes fall back to the raw code. */
fun consignmentStatusLabel(code: String, t: Translate): String = when (code) {
    "OUT" -> t("consignments.statusOut", null)
    "SETTLED" -> t("consignments.statusSettled", null)
    "RETURNED" -> t("consignments.statusReturned", null)
    else -> code
}

/** Keyed fact row: muted label left, value right, hairline below unless [last]. */
@Composable
fun FactRow(label: String, last: Boolean = false, value: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted, modifier = Modifier.weight(1f))
        Spacer(Modifier.width(Tokens.Space.md))
        value()
    }
    if (!last) HorizontalDivider(color = Tokens.border)
}

/** The subject of a write sheet (partner + mono IMEI / amount): a surface-2 block, never a nested card. */
@Composable
fun SubjectBlock(title: String, line: String, mono: Boolean = true, trailing: (@Composable () -> Unit)? = null) {
    Row(
        Modifier.fillMaxWidth()
            .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
            .padding(Tokens.Space.lg),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
            val base = MaterialTheme.typography.bodyMedium
            Text(line, style = if (mono) base.copy(fontFamily = MonoFamily) else base, color = Tokens.text)
        }
        trailing?.invoke()
    }
}

/** Inline error/offline line for the action sheets. */
@Composable
fun ActionError(message: String?, offline: Boolean, modifier: Modifier = Modifier) {
    if (message == null && !offline) return
    val t = LocalT.current
    Text(
        if (offline) t("common.offline", null) else message.orEmpty(),
        style = MaterialTheme.typography.bodySmall,
        color = Tokens.danger,
        modifier = modifier,
    )
}
