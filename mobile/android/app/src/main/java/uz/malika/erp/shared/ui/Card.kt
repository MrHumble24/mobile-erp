package uz.malika.erp.shared.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

private val CardShape = RoundedCornerShape(12.dp) // radius-cards

/**
 * A bordered surface with the soft Caldera shadow — the default container for
 * grouped content. Tappable when [onClick] is given.
 */
@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    padding: PaddingValues = PaddingValues(16.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val clickMod = if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
    Surface(
        shape = CardShape,
        color = Tokens.surfaceCanvas,
        modifier = modifier
            .shadow(3.dp, CardShape, clip = false)
            .border(BorderStroke(1.dp, Tokens.border), CardShape)
            .then(clickMod),
    ) {
        Column(Modifier.padding(padding), content = content)
    }
}
