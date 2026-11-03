package uz.malika.erp.shared.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonColors
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/** Caldera button variants (shadcn parity). */
enum class ButtonVariant { DEFAULT, SECONDARY, OUTLINE, GHOST, DESTRUCTIVE }

private val PillShape = RoundedCornerShape(50)
private val Pad = PaddingValues(horizontal = Tokens.Space.buttonH, vertical = Tokens.Space.buttonV)

/**
 * The one button. Pill-shaped (radius-full), 6 Caldera variants. Feature screens
 * use this — never a raw Material [Button] with default styling.
 */
@Composable
fun PillButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.DEFAULT,
    enabled: Boolean = true,
) {
    when (variant) {
        ButtonVariant.OUTLINE -> OutlinedButton(
            onClick = onClick,
            modifier = modifier,
            enabled = enabled,
            shape = PillShape,
            contentPadding = Pad,
            border = BorderStroke(1.dp, Tokens.border),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Tokens.foreground),
        ) { Text(text) }

        ButtonVariant.GHOST -> TextButton(
            onClick = onClick,
            modifier = modifier,
            enabled = enabled,
            shape = PillShape,
            contentPadding = Pad,
            colors = ButtonDefaults.textButtonColors(contentColor = Tokens.foreground),
        ) { Text(text) }

        else -> Button(
            onClick = onClick,
            modifier = modifier,
            enabled = enabled,
            shape = PillShape,
            contentPadding = Pad,
            colors = variant.filledColors(),
        ) { Text(text) }
    }
}

@Composable
private fun ButtonVariant.filledColors(): ButtonColors = when (this) {
    ButtonVariant.SECONDARY -> ButtonDefaults.buttonColors(
        containerColor = Tokens.secondary,
        contentColor = Tokens.secondaryForeground,
    )
    ButtonVariant.DESTRUCTIVE -> ButtonDefaults.buttonColors(
        containerColor = Tokens.destructive,
        contentColor = Tokens.signalWhite,
    )
    else -> ButtonDefaults.buttonColors(
        containerColor = Tokens.primary,
        contentColor = Tokens.primaryForeground,
    )
}
