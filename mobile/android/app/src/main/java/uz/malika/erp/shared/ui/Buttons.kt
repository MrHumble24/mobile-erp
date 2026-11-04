package uz.malika.erp.shared.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * Button variants. OUTLINE keeps its name but is now a borderless surface-2
 * button (Warm Card has no borders except inputs); only PRIMARY/DESTRUCTIVE
 * carry a fill the eye reads as pressable, and only PRIMARY is the one orange.
 */
enum class ButtonVariant { DEFAULT, SECONDARY, OUTLINE, GHOST, DESTRUCTIVE }

private val ButtonShape = RoundedCornerShape(Tokens.Radius.buttons) // 14
private val ControlHeight = 52.dp

/**
 * The one button. Radius 14, 52 dp tall, zero elevation. Built on a clickable
 * [Surface] so it takes the theme's press feedback (scale + surface-2 wash via
 * `LocalIndication`) — Material `Button` ignores `LocalIndication`, so the kit
 * owns the surface instead. Feature screens use this, never a raw Material button.
 */
@Composable
fun PillButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.DEFAULT,
    enabled: Boolean = true,
) {
    val (container, content) = variant.colors(enabled)
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = ButtonShape,
        color = container,
        contentColor = content,
        modifier = modifier.semantics { role = Role.Button },
    ) {
        Box(
            Modifier
                .defaultMinSize(minHeight = ControlHeight)
                .padding(horizontal = Tokens.Space.buttonH, vertical = Tokens.Space.buttonV),
            contentAlignment = Alignment.Center,
        ) {
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun ButtonVariant.colors(enabled: Boolean): Pair<Color, Color> {
    if (!enabled) return Tokens.surface2 to Tokens.muted
    return when (this) {
        // Dark lifts `danger` to a pink text hue, so a white label would fail AA;
        // the dark destructive pill is the status pair instead (dangerBg + danger).
        ButtonVariant.DESTRUCTIVE ->
            if (isSystemInDarkTheme()) Tokens.dangerBg to Tokens.danger else Tokens.danger to Tokens.onAction
        ButtonVariant.SECONDARY, ButtonVariant.OUTLINE -> Tokens.surface2 to Tokens.text
        ButtonVariant.GHOST -> Color.Transparent to Tokens.text
        ButtonVariant.DEFAULT -> Tokens.action to Tokens.onAction
    }
}
