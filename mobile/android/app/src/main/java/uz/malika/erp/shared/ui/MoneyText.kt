package uz.malika.erp.shared.ui

import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.ui.theme.MonoFamily

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
