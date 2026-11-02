package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.nasiya.model.creditUsedFraction
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.Tokens

/**
 * Small slice-local Caldera pieces the kit does not ship yet: a summary metric
 * tile and the partner credit bar. Built from [Tokens] only (no raw Material
 * styling). The integrator may promote these to `shared/ui` if reused.
 */

/** A summary stat tile (parity with the web `MetricCard`). */
@Composable
fun MetricTile(label: String, value: String, dark: Boolean = false, modifier: Modifier = Modifier) {
    AppCard(
        modifier = modifier,
        padding = androidx.compose.foundation.layout.PaddingValues(16.dp),
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            color = if (dark) Tokens.fog else Tokens.mutedForeground,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = if (dark) Tokens.signalWhite else Tokens.foreground,
        )
    }
}

/** Outstanding-vs-limit bar; shows "unlimited" when the partner has no limit. */
@Composable
fun CreditBar(creditLimit: String, outstanding: String, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val fraction = creditUsedFraction(creditLimit, outstanding)
    if (fraction == null) {
        Text(
            t("partners.creditUnlimited", null),
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.mutedForeground,
        )
        return
    }
    val color = when {
        fraction >= 0.9f -> Tokens.destructive
        fraction >= 0.7f -> Tokens.warning
        else -> Tokens.success
    }
    Column(modifier) {
        Row(Modifier.fillMaxWidth()) {
            MoneyText(outstanding, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.weight(1f))
            MoneyText(creditLimit, style = MaterialTheme.typography.labelSmall)
        }
        Spacer(Modifier.height(4.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .height(6.dp)
                .background(Tokens.mercury, RoundedCornerShape(100)),
        ) {
            Box(
                Modifier
                    .fillMaxWidth(fraction)
                    .height(6.dp)
                    .background(color, RoundedCornerShape(100)),
            )
        }
    }
}

/** Caldera status color for a consignment status code. */
fun consignmentStatusColor(code: String): Color = when (code) {
    "OUT" -> Tokens.signalBlue
    "SETTLED" -> Tokens.success
    "RETURNED" -> Tokens.ash
    else -> Tokens.slate
}

/** Inline error/offline line for the action sheets. */
@Composable
fun ActionError(message: String?, offline: Boolean, modifier: Modifier = Modifier) {
    if (message == null && !offline) return
    val t = LocalT.current
    Text(
        if (offline) t("common.offline", null) else message.orEmpty(),
        style = MaterialTheme.typography.bodySmall,
        color = Tokens.destructive,
        modifier = modifier.padding(top = 4.dp),
    )
}
