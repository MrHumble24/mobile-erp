package uz.malika.erp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

/**
 * Caldera light theme. The web app ships no dark block, so this is light-only
 * and dynamic color is deliberately NOT used — the near-monochrome palette is
 * the brand. Feature screens read colors through [MaterialTheme.colorScheme]
 * and the shared UI kit; raw [Tokens] are used only inside `ui/theme` and the kit.
 */
private val CalderaColorScheme = lightColorScheme(
    primary = Tokens.primary,
    onPrimary = Tokens.primaryForeground,
    secondary = Tokens.secondary,
    onSecondary = Tokens.secondaryForeground,
    tertiary = Tokens.brandViolet,
    onTertiary = Tokens.signalWhite,
    background = Tokens.background,
    onBackground = Tokens.foreground,
    surface = Tokens.surfaceCanvas,
    onSurface = Tokens.foreground,
    surfaceVariant = Tokens.mist,
    onSurfaceVariant = Tokens.mutedForeground,
    surfaceContainerLowest = Tokens.surfaceCanvas,
    surfaceContainerLow = Tokens.surfaceCard,
    surfaceContainer = Tokens.surfaceCard,
    surfaceContainerHigh = Tokens.plaster,
    error = Tokens.destructive,
    onError = Tokens.signalWhite,
    outline = Tokens.border,
    outlineVariant = Tokens.cloud,
)

@Composable
fun MalikaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = CalderaColorScheme,
        typography = calderaTypography,
        content = content,
    )
}
