package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The persistent cart bar for Catalog mode (ADR 0031): line count on the left,
 * total on the right, the one orange pressable thing on the screen — tapping it
 * opens the cart + checkout. It floats at the bottom so the cart stays reachable
 * on a phone without scrolling past the whole grid.
 */
@Composable
fun CartBar(lineCount: Int, total: String, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    Surface(
        color = Tokens.action,
        shape = RoundedCornerShape(Tokens.Radius.buttons),
        modifier = modifier.fillMaxWidth(),
    ) {
        Row(
            Modifier
                .clickable(onClick = onOpen)
                .height(56.dp)
                .fillMaxWidth()
                .padding(horizontal = Tokens.Space.gutter),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Outlined.ShoppingCart, contentDescription = null, tint = Tokens.onAction)
            Text(
                t("pos.lineCount", mapOf("count" to lineCount)),
                style = MaterialTheme.typography.bodyLarge,
                color = Tokens.onAction,
                modifier = Modifier.weight(1f).padding(start = Tokens.Space.md),
            )
            Text(
                formatMoney(total),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontFamily = MonoFamily,
                    fontWeight = FontWeight.Bold,
                ),
                color = Tokens.onAction,
            )
        }
    }
}
