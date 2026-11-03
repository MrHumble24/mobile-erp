package uz.malika.erp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.unit.dp

/**
 * Ink theme. Dynamic color is deliberately NOT used — the pure monochrome palette
 * is the brand. Light/dark are picked by [isSystemInDarkTheme]; both are built from
 * the raw [Tokens.Light] / [Tokens.Dark] values (the adaptive `Tokens.*` getters are
 * composable and can't run in these top-level scheme initializers). Feature screens
 * read the adaptive `Tokens.*`, so they flip with the scheme.
 */
private val InkLight = lightColorScheme(
    primary = Tokens.Light.accent,
    onPrimary = Tokens.Light.onAccent,
    secondary = Tokens.Light.surface2,
    onSecondary = Tokens.Light.fg,
    secondaryContainer = Tokens.Light.surface2,
    onSecondaryContainer = Tokens.Light.fg,
    tertiary = Tokens.Light.accent,
    onTertiary = Tokens.Light.onAccent,
    background = Tokens.Light.bg,
    onBackground = Tokens.Light.fg,
    surface = Tokens.Light.surface,
    onSurface = Tokens.Light.fg,
    surfaceVariant = Tokens.Light.surface2,
    onSurfaceVariant = Tokens.Light.muted,
    surfaceContainerLowest = Tokens.Light.bg,
    surfaceContainerLow = Tokens.Light.surface,
    surfaceContainer = Tokens.Light.surface2,
    surfaceContainerHigh = Tokens.Light.surface2,
    error = Tokens.Light.danger,
    onError = Tokens.Light.onAccent,
    errorContainer = Tokens.Light.dangerBg,
    onErrorContainer = Tokens.Light.danger,
    outline = Tokens.Light.hairline,
    outlineVariant = Tokens.Light.hairline,
)

private val InkDark = darkColorScheme(
    primary = Tokens.Dark.accent,
    onPrimary = Tokens.Dark.onAccent,
    secondary = Tokens.Dark.surface2,
    onSecondary = Tokens.Dark.fg,
    secondaryContainer = Tokens.Dark.surface2,
    onSecondaryContainer = Tokens.Dark.fg,
    tertiary = Tokens.Dark.accent,
    onTertiary = Tokens.Dark.onAccent,
    background = Tokens.Dark.bg,
    onBackground = Tokens.Dark.fg,
    surface = Tokens.Dark.surface,
    onSurface = Tokens.Dark.fg,
    surfaceVariant = Tokens.Dark.surface2,
    onSurfaceVariant = Tokens.Dark.muted,
    surfaceContainerLowest = Tokens.Dark.bg,
    surfaceContainerLow = Tokens.Dark.surface,
    surfaceContainer = Tokens.Dark.surface2,
    surfaceContainerHigh = Tokens.Dark.surface2,
    error = Tokens.Dark.danger,
    onError = Tokens.Dark.onAccent,
    errorContainer = Tokens.Dark.dangerBg,
    onErrorContainer = Tokens.Dark.danger,
    outline = Tokens.Dark.hairline,
    outlineVariant = Tokens.Dark.hairline,
)

private val InkShapes = Shapes(
    small = RoundedCornerShape(10.dp), // inputs, controls
    medium = RoundedCornerShape(12.dp), // cards, lists
    large = RoundedCornerShape(20.dp), // large cards
)

@Composable
fun MalikaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) InkDark else InkLight,
        typography = calderaTypography,
        shapes = InkShapes,
    ) {
        // Material defaults inflate every control to a 48dp touch target, which is
        // what makes rows, buttons, segments and pickers read looser than iOS.
        // Drop to 40dp (still accessible) so controls match the iOS density.
        CompositionLocalProvider(
            LocalMinimumInteractiveComponentSize provides Tokens.minTouch,
            content = content,
        )
    }
}
