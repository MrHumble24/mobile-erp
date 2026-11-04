package uz.malika.erp.shared.ui

import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Money rendered in the mono face (Sometype Mono) so amounts align in tables.
 * [value] is a Decimal string from the server; it is parsed, never cast to a float.
 */
@Composable
fun MoneyText(
    value: String?,
    modifier: Modifier = Modifier,
    style: TextStyle = LocalTextStyle.current,
) {
    Text(formatMoney(value), modifier = modifier, style = style.copy(fontFamily = MonoFamily))
}

/**
 * Emphasis colour for a profit figure, tinted by SIGN not by metric identity:
 * negative → [Tokens.danger], zero or positive → [Tokens.success]. The one helper
 * for every profit/net figure (gross profit, net operating income, net profit).
 * Revenue stays the plain text colour; expenses are always danger.
 */
@Composable
@ReadOnlyComposable
fun signTint(value: String?): Color =
    if (parseMoney(value).signum() < 0) Tokens.danger else Tokens.success
