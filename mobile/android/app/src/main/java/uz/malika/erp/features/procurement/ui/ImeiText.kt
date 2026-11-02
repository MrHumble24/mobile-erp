package uz.malika.erp.features.procurement.ui

import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import uz.malika.erp.ui.theme.MonoFamily

/** IMEIs render in the mono face so 15-digit codes align (THEME requirement). */
@Composable
fun ImeiText(imei: String, modifier: Modifier = Modifier, style: TextStyle = LocalTextStyle.current) {
    Text(imei, modifier = modifier, style = style.copy(fontFamily = MonoFamily))
}
