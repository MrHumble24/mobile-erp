package uz.malika.erp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Ink design tokens — the single source of truth on Android, mirrored from the
 * chosen mobile theme spec `docs/design/mobile-themes/theme-01-ink.html`
 * ([Light] = `:root`, [Dark] = the `prefers-color-scheme:dark` block).
 * Change a value there and here, nowhere else. Semantic mapping into the
 * Material3 ColorScheme/Shapes/Typography lives in [MalikaTheme] and [calderaTypography].
 *
 * Ink is pure monochrome: fg = ink, accent = ink, surfaces white, one hairline,
 * no shadows; the only colour on screen is status. Every surface/text/border/status
 * token is a `@Composable @ReadOnlyComposable` getter that picks [Light] or [Dark]
 * off `isSystemInDarkTheme()`, so feature screens that read `Tokens.*` adapt with no
 * call-site change. Fixed brand/chart colours and metrics stay plain vals.
 * The raw [Light]/[Dark] values feed the non-composable M3 schemes in Theme.kt.
 */
object Tokens {

    /** Ink light palette — raw values (feeds the M3 lightColorScheme). */
    object Light {
        val bg = Color(0xFFFFFFFF)
        val surface = Color(0xFFFFFFFF)
        val surface2 = Color(0xFFF1F1F2)
        val fg = Color(0xFF202020)
        val muted = Color(0xFF6B6B6B)
        val hairline = Color(0xFFE6E6E6)
        val accent = Color(0xFF202020)
        val onAccent = Color(0xFFFFFFFF)
        val success = Color(0xFF059669)
        val warning = Color(0xFFD97706)
        val danger = Color(0xFFE11D48)
        val info = Color(0xFF0A84FF)
        val successBg = Color(0xFFE6F6EF)
        val warningBg = Color(0xFFFBF0DC)
        val dangerBg = Color(0xFFFCE7EC)
        val infoBg = Color(0xFFE3F0FF)
    }

    /** Ink dark palette — raw values (feeds the M3 darkColorScheme). */
    object Dark {
        val bg = Color(0xFF0A0A0A)
        val surface = Color(0xFF141414)
        val surface2 = Color(0xFF1F1F1F)
        val fg = Color(0xFFF2F2F2)
        val muted = Color(0xFF9B9B9B)
        val hairline = Color(0xFF262626)
        val accent = Color(0xFFF2F2F2)
        val onAccent = Color(0xFF141414)
        val success = Color(0xFF34D399)
        val warning = Color(0xFFFBBF24)
        val danger = Color(0xFFFB7185)
        val info = Color(0xFF5AAAFF)
        val successBg = Color(0xFF0F2A20)
        val warningBg = Color(0xFF2E2410)
        val dangerBg = Color(0xFF331520)
        val infoBg = Color(0xFF10243A)
    }

    private val dark: Boolean @Composable @ReadOnlyComposable get() = isSystemInDarkTheme()

    // Adaptive surfaces.
    val background: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.bg else Light.bg
    val surfaceCanvas: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface else Light.surface
    val surfaceCard: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface else Light.surface
    val surface2: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface2 else Light.surface2
    val secondary: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface2 else Light.surface2
    val muted: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface2 else Light.surface2
    val accent: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface2 else Light.surface2
    val mist: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface2 else Light.surface2

    // Adaptive text.
    val foreground: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.fg else Light.fg
    val secondaryForeground: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.fg else Light.fg
    val inkBlack: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.fg else Light.fg
    val onyx: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.fg else Light.fg
    val mutedForeground: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.muted else Light.muted
    val slate: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.muted else Light.muted
    val ash: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.muted else Light.muted

    // Adaptive border / hairline.
    val hairline: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.hairline else Light.hairline
    val border: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.hairline else Light.hairline
    val input: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.hairline else Light.hairline
    val bone: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.hairline else Light.hairline

    // Adaptive accent (Ink = ink-black / off-white).
    val primary: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.accent else Light.accent
    val primaryForeground: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.onAccent else Light.onAccent

    // Adaptive status + tint backgrounds.
    val success: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.success else Light.success
    val warning: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.warning else Light.warning
    val danger: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.danger else Light.danger
    val destructive: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.danger else Light.danger
    val info: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.info else Light.info
    val successBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.successBg else Light.successBg
    val warningBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.warningBg else Light.warningBg
    val dangerBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.dangerBg else Light.dangerBg
    val dangerSurface: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.dangerBg else Light.dangerBg
    val infoBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.infoBg else Light.infoBg

    // Fixed brand palette (not theme-adaptive).
    val signalWhite = Color(0xFFFFFFFF)
    val carbon = Color(0xFF2A2A2A)
    val fog = Color(0xFFB3B3B3)
    val cloud = Color(0xFFD4D4D4)
    val plaster = Color(0xFFE9EBF0)
    val mercury = Color(0xFFEEEEEE)
    val brandViolet = Color(0xFF6647F0)
    val signalBlue = Color(0xFF0091FF)
    val mint = Color(0xFF6EE7B7)
    val emerald = Color(0xFF00C07A)
    val tealTag = Color(0xFF16C0A4)
    val ring = signalBlue
    val surfaceSectionBand = Color(0xFFE9EBF0)
    val surfaceDarkPanel = Color(0xFF141414)
    val surfaceInk = Color(0xFF0A0A0A)

    /**
     * Layout density — the single source of truth for spacing, mirrored from the
     * iOS app ([Tokens.swift] / its screens) so Android reads as compact, not
     * loose. Feature screens and `shared/ui` use these instead of ad-hoc literals.
     */
    object Space {
        val screenH = 16.dp   // screen horizontal gutter (iOS `.padding()`)
        val section = 16.dp   // gap between major sections
        val cardInner = 14.dp // card / tile inner padding (iOS AppCard→SummaryTile)
        val rowV = 6.dp       // list-row vertical rhythm
        val gap = 8.dp        // small inline gap
        val chipH = 12.dp     // status chip horizontal padding
        val chipV = 6.dp      // status chip vertical padding
        val buttonH = 20.dp   // pill button horizontal padding
        val buttonV = 10.dp   // pill button vertical padding (→ ~40dp tall)
        val listBottom = 24.dp     // bottom inset for a scrolling list with no FAB (breathing room above the bottom bar)
        val fabClearance = 88.dp   // bottom inset for a list under a FAB: 56dp FAB + 16dp margin + 16dp breathing room
    }

    /** Minimum touch target — tighter than Material's 48dp default, ≥40dp for a11y. */
    val minTouch = 40.dp

    // Named corner radii.
    val radiusInputs = 10.dp // inputs / controls / segments
    val radiusCards = 12.dp
    val radiusImages = 16.dp
    val radiusLargeCards = 20.dp
    val radiusFull = 9999.dp // buttons / badges — pill

    // Type scale in sp.
    val textBodySm = 14.sp
    val textBody = 16.sp
    val textSubheading = 20.sp
    val textHeadingSm = 34.sp
    val textHeading = 48.sp
    val textHeadingLg = 60.sp
    val textDisplay = 80.sp

    // Caldera chart palette (fixed role order).
    val chart = listOf(
        Color(0xFF2A78D6), Color(0xFFEB6834), Color(0xFF1BAF7A), Color(0xFFEDA100),
        Color(0xFFE87BA4), Color(0xFF008300), Color(0xFF6250D6), Color(0xFFE34948),
    )
}
