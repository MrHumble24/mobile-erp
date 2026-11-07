package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private data class Bar(val width: Dp, val isHidden: Boolean)

/**
 * Decorative barcode visual with monospace value caption for receipts and tags.
 * Deterministically mirrors `client/src/shared/ui/barcode-visual.tsx`.
 */
@Composable
fun BarcodeVisual(
    value: String,
    modifier: Modifier = Modifier,
    height: Dp = 32.dp,
    barColor: Color = Tokens.text,
) {
    if (value.isBlank()) return

    val bars = remember(value) {
        val chars = value.toByteArray(Charsets.UTF_8)
        val count = chars.size.coerceAtLeast(1)
        List(42) { i ->
            val charCode = if (chars.isNotEmpty()) chars[i % count].toInt() and 0xFF else 48
            val isThick = ((charCode + i * 7) % 3) == 0
            val isMedium = ((charCode + i * 5) % 2) == 0
            val width = if (isThick) 3.dp else if (isMedium) 2.dp else 1.dp
            val isHidden = (i * 13) % 9 == 0 && i in 4..37
            Bar(width, isHidden)
        }
    }

    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(
            modifier = Modifier.height(height),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            bars.forEach { bar ->
                if (bar.isHidden) {
                    Spacer(Modifier.width(bar.width))
                } else {
                    Box(
                        Modifier
                            .width(bar.width)
                            .height(height)
                            .background(barColor)
                    )
                }
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = value,
            style = TextStyle(
                fontFamily = MonoFamily,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.5.sp,
            ),
            color = Tokens.muted,
        )
    }
}

