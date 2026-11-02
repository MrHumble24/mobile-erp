package uz.malika.erp.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Caldera design tokens — the single source of truth on Android, mirrored 1:1
 * (same names, camelCased) from the web client's `client/src/app/styles/index.css`.
 * Change a value there and here, nowhere else. Semantic mapping into the
 * Material3 ColorScheme/Typography lives in [Theme] and [calderaTypography].
 *
 * The admin UI is near-monochrome: primary = ink-black, secondary/muted = mist,
 * border = bone, ring = signal-blue, destructive = #e53935, plus status colors.
 */
object Tokens {

    // Raw brand palette (the `--color-*` custom properties).
    val signalWhite = Color(0xFFFFFFFF)
    val inkBlack = Color(0xFF202020)
    val onyx = Color(0xFF090C1D)
    val carbon = Color(0xFF2A2A2A)
    val slate = Color(0xFF646464)
    val ash = Color(0xFF838383)
    val fog = Color(0xFFB3B3B3)
    val cloud = Color(0xFFD4D4D4)
    val bone = Color(0xFFE8E8E8)
    val mist = Color(0xFFF8F9FA)
    val plaster = Color(0xFFE9EBF0)
    val mercury = Color(0xFFEEEEEE)

    val brandViolet = Color(0xFF6647F0)
    val signalBlue = Color(0xFF0091FF)
    val mint = Color(0xFF6EE7B7)
    val emerald = Color(0xFF00C07A)
    val tealTag = Color(0xFF16C0A4)

    val destructive = Color(0xFFE53935)

    // Status accents used across the admin UI (success/warn/danger + danger surface).
    val success = Color(0xFF059669) // emerald-600
    val warning = Color(0xFFD97706) // amber-600
    val danger = Color(0xFFE11D48) // rose-600
    val dangerSurface = Color(0xFFFFF1F2) // rose-50

    // Surfaces (the `--surface-*` custom properties).
    val surfaceCanvas = Color(0xFFFFFFFF)
    val surfaceCard = Color(0xFFF8F9FA)
    val surfaceSectionBand = Color(0xFFE9EBF0)
    val surfaceDarkPanel = Color(0xFF111111)
    val surfaceInk = Color(0xFF000000)

    // Semantic (shadcn) mapping from index.css.
    val background = surfaceCanvas
    val foreground = inkBlack
    val primary = inkBlack
    val primaryForeground = signalWhite
    val secondary = mist
    val secondaryForeground = inkBlack
    val muted = mist
    val mutedForeground = slate
    val accent = mist
    val border = bone
    val input = bone
    val ring = signalBlue

    // Named corner radii (`--radius-*`).
    val radiusInputs = 9.dp
    val radiusCards = 12.dp
    val radiusImages = 16.dp
    val radiusLargeCards = 20.dp
    val radiusFull = 9999.dp // buttons / badges — pill

    // Type scale in sp (`--text-*`).
    val textBodySm = 14.sp
    val textBody = 16.sp
    val textSubheading = 20.sp
    val textHeadingSm = 34.sp
    val textHeading = 48.sp
    val textHeadingLg = 60.sp
    val textDisplay = 80.sp

    // Caldera chart palette (fixed role order) — used by later report waves.
    val chart = listOf(
        Color(0xFF2A78D6), Color(0xFFEB6834), Color(0xFF1BAF7A), Color(0xFFEDA100),
        Color(0xFFE87BA4), Color(0xFF008300), Color(0xFF6250D6), Color(0xFFE34948),
    )
}
