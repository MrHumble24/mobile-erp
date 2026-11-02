package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * A pill status chip tinted by a semantic color (12% fill, solid label). Pass a
 * [Tokens] status color (success / warning / danger) or any accent.
 */
@Composable
fun StatusChip(
    label: String,
    modifier: Modifier = Modifier,
    color: Color = Tokens.slate,
) {
    androidx.compose.foundation.layout.Box(
        modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(100.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = color)
    }
}
