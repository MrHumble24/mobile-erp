package uz.malika.erp.shared.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.ui.theme.Tokens

private val CardShape = RoundedCornerShape(Tokens.Radius.cards) // 16

/**
 * A Warm Card content block: white [Tokens.card] on the warm ground, radius 16,
 * 20 dp padding, NO border and NO shadow — contrast against the ground is the
 * edge. When [onClick] is given it is pressable; the press feedback (scale +
 * surface-2 wash) is the theme's indication, not a Material ripple.
 */
@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    padding: PaddingValues = PaddingValues(Tokens.Space.cardPad),
    content: @Composable ColumnScope.() -> Unit,
) {
    val clickMod = if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
    Surface(
        shape = CardShape,
        color = Tokens.card,
        modifier = modifier.then(clickMod),
    ) {
        Column(Modifier.padding(padding), content = content)
    }
}
