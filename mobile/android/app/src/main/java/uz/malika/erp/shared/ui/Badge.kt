package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import uz.malika.erp.ui.theme.Tokens

/**
 * A status pill (DESIGN.md): a tinted background with the status hue as the
 * label, pill-shaped, labelMedium 12/600. [color] is the status hue (e.g.
 * [Tokens.success]); the background is a soft tint of that same hue, so one
 * argument carries both. Status meaning is owned by `DeviceStatusMeta.color`
 * and the status tokens — one hue per meaning across every screen.
 */
@Composable
fun StatusChip(
    label: String,
    modifier: Modifier = Modifier,
    color: Color = Tokens.sold,
) {
    Box(
        modifier
            .background(color.copy(alpha = 0.14f), RoundedCornerShape(Tokens.Radius.pill))
            .padding(horizontal = Tokens.Space.chipH, vertical = Tokens.Space.chipV),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = color)
    }
}
