package uz.malika.erp.ui.theme

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ripple.RippleAlpha
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.LocalRippleConfiguration
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RippleConfiguration
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import uz.malika.erp.shared.ui.PressIndication

/**
 * Warm Card theme. Dynamic Color is deliberately NOT used — the warm palette and
 * its one orange are the brand. Light/dark are picked by [isSystemInDarkTheme];
 * both are built from the raw [Tokens.Light] / [Tokens.Dark] values. Feature
 * screens read the adaptive `Tokens.*`, so they flip with the scheme.
 *
 * [LocalIndication] is the Warm Card [PressIndication] (scale 0.98 + surface-2
 * wash), used by every `clickable` surface and the kit's [PressIndication]-based
 * PillButton. Material internals that ignore `LocalIndication` (IconButton,
 * Switch, Checkbox, DropdownMenuItem, NavigationRailItem, ExtendedFAB) keep a
 * ripple, but a muted monochrome one: [LocalRippleConfiguration] is retinted to
 * [Tokens.text] at low alpha so it reads as a quiet state layer, never the loud
 * default (see README for the exact exception).
 */
private val WarmLight = lightColorScheme(
    primary = Tokens.Light.action,
    onPrimary = Tokens.Light.onAction,
    secondary = Tokens.Light.surface2,
    onSecondary = Tokens.Light.text,
    secondaryContainer = Tokens.Light.surface2,
    onSecondaryContainer = Tokens.Light.text,
    tertiary = Tokens.Light.action,
    onTertiary = Tokens.Light.onAction,
    background = Tokens.Light.ground,
    onBackground = Tokens.Light.text,
    surface = Tokens.Light.card,
    onSurface = Tokens.Light.text,
    surfaceVariant = Tokens.Light.surface2,
    onSurfaceVariant = Tokens.Light.muted,
    surfaceContainerLowest = Tokens.Light.ground,
    surfaceContainerLow = Tokens.Light.card,
    surfaceContainer = Tokens.Light.surface2,
    surfaceContainerHigh = Tokens.Light.surface2,
    error = Tokens.Light.danger,
    onError = Tokens.Light.onAction,
    errorContainer = Tokens.Light.dangerBg,
    onErrorContainer = Tokens.Light.danger,
    outline = Tokens.Light.border,
    outlineVariant = Tokens.Light.border,
)

private val WarmDark = darkColorScheme(
    primary = Tokens.Dark.action,
    onPrimary = Tokens.Dark.onAction,
    secondary = Tokens.Dark.surface2,
    onSecondary = Tokens.Dark.text,
    secondaryContainer = Tokens.Dark.surface2,
    onSecondaryContainer = Tokens.Dark.text,
    tertiary = Tokens.Dark.action,
    onTertiary = Tokens.Dark.onAction,
    background = Tokens.Dark.ground,
    onBackground = Tokens.Dark.text,
    surface = Tokens.Dark.card,
    onSurface = Tokens.Dark.text,
    surfaceVariant = Tokens.Dark.surface2,
    onSurfaceVariant = Tokens.Dark.muted,
    surfaceContainerLowest = Tokens.Dark.ground,
    surfaceContainerLow = Tokens.Dark.card,
    surfaceContainer = Tokens.Dark.surface2,
    surfaceContainerHigh = Tokens.Dark.surface2,
    error = Tokens.Dark.danger,
    onError = Tokens.Dark.onAction,
    errorContainer = Tokens.Dark.dangerBg,
    onErrorContainer = Tokens.Dark.danger,
    outline = Tokens.Dark.border,
    outlineVariant = Tokens.Dark.border,
)

private val WarmShapes = Shapes(
    small = RoundedCornerShape(Tokens.Radius.inputs),  // inputs, controls (12)
    medium = RoundedCornerShape(Tokens.Radius.cards),  // cards (16)
    large = RoundedCornerShape(Tokens.Radius.large),   // sheets, large cards (20)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MalikaTheme(content: @Composable () -> Unit) {
    val surface2 = Tokens.surface2
    val indication = remember(surface2) { PressIndication(surface2) }
    val rippleColor = Tokens.text
    val ripple = remember(rippleColor) {
        RippleConfiguration(
            color = rippleColor,
            rippleAlpha = RippleAlpha(
                pressedAlpha = 0.10f,
                focusedAlpha = 0.08f,
                draggedAlpha = 0.10f,
                hoveredAlpha = 0.06f,
            ),
        )
    }
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) WarmDark else WarmLight,
        typography = calderaTypography,
        shapes = WarmShapes,
    ) {
        CompositionLocalProvider(
            LocalMinimumInteractiveComponentSize provides Tokens.minTouch,
            LocalIndication provides indication,
            LocalRippleConfiguration provides ripple,
            content = content,
        )
    }
}
