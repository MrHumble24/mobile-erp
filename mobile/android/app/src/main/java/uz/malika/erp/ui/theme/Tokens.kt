package uz.malika.erp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Warm Card design tokens — the single source of truth on Android, mirrored from
 * `DESIGN.md` (repo root; [Light] = its light palette, [Dark] = the dark values
 * resolved during this build to WCAG AA on the dark card). Change a value in
 * DESIGN.md and here, nowhere else. Semantic mapping into the Material3
 * ColorScheme/Shapes/Typography lives in [MalikaTheme] and [calderaTypography].
 *
 * The world: a warm tinted [ground], white [card]s with no border or shadow,
 * [surface2] for secondary controls, one [action] orange that only ever marks
 * something pressable. Status hues are the only other colour and keep one meaning.
 *
 * Every surface/text/status token is a `@Composable @ReadOnlyComposable` getter
 * that picks [Light] or [Dark] off `isSystemInDarkTheme()`, so feature screens
 * reading `Tokens.*` adapt with no call-site change. The raw [Light]/[Dark]
 * values feed the non-composable M3 schemes in Theme.kt. Legacy getter names
 * (surfaceCanvas, foreground, primary, slate, bone, …) are kept as aliases onto
 * the Warm Card roles so the existing call sites compile unchanged.
 */
object Tokens {

    /** Warm Card light palette — raw values (feeds the M3 lightColorScheme). */
    object Light {
        val ground = Color(0xFFFBF6EE)
        val card = Color(0xFFFFFFFF)
        val surface2 = Color(0xFFF4ECDF)
        val border = Color(0xFFE7DACB)
        val text = Color(0xFF2B2B2B)
        val muted = Color(0xFF8A8378)
        val action = Color(0xFFFF5A1F)
        val actionPressed = Color(0xFFE64D15)
        val onAction = Color(0xFFFFFFFF)
        // Status hues are the deep ramp step so the hue-on-tint pill clears WCAG AA
        // on the light tint (DESIGN.md corrected 2026-11-03; see README for ratios).
        val success = Color(0xFF12603A)
        val successBg = Color(0xFFE3F5EA)
        val danger = Color(0xFFAB1E30)
        val dangerBg = Color(0xFFFBE3E6)
        val warning = Color(0xFF7A4D00)
        val warningBg = Color(0xFFFCEFD6)
        val info = Color(0xFF2455AD)
        val infoBg = Color(0xFFE4ECFB)
        val sold = Color(0xFF5E5E5E)
        val soldBg = Color(0xFFEFEAE2)
    }

    /**
     * Warm Card dark palette — raw values (feeds the M3 darkColorScheme). Status
     * hues lifted up the design.json ramp and tints darkened until the hue-on-tint
     * pair clears WCAG AA (4.5:1) on the dark card; see the module README for the
     * measured ratios. `action` stays the same orange in both modes (DESIGN.md).
     */
    object Dark {
        val ground = Color(0xFF1C1713)
        val card = Color(0xFF2A231D)
        val surface2 = Color(0xFF352C24)
        val border = Color(0xFF3A312A)
        val text = Color(0xFFF4EDE4)
        val muted = Color(0xFFA89C8E)
        val action = Color(0xFFFF5A1F)
        val actionPressed = Color(0xFFE64D15)
        val onAction = Color(0xFFFFFFFF)
        val success = Color(0xFF3DB876)
        val successBg = Color(0xFF0B3F24)
        val danger = Color(0xFFF28F9B)
        val dangerBg = Color(0xFF7E1626)
        val warning = Color(0xFFF0A633)
        val warningBg = Color(0xFF4D3100)
        val info = Color(0xFF5C8FE5)
        val infoBg = Color(0xFF10264F)
        val sold = Color(0xFFA89C8E)
        val soldBg = Color(0xFF352C24)
    }

    private val dark: Boolean @Composable @ReadOnlyComposable get() = isSystemInDarkTheme()

    // Canonical Warm Card roles.
    val ground: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.ground else Light.ground
    val card: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.card else Light.card
    val surface2: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.surface2 else Light.surface2
    val border: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.border else Light.border
    val text: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.text else Light.text
    val muted: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.muted else Light.muted
    val action: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.action else Light.action
    val actionPressed: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.actionPressed else Light.actionPressed
    val onAction: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.onAction else Light.onAction

    // Status hues + their tint backgrounds.
    val success: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.success else Light.success
    val successBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.successBg else Light.successBg
    val danger: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.danger else Light.danger
    val dangerBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.dangerBg else Light.dangerBg
    val warning: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.warning else Light.warning
    val warningBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.warningBg else Light.warningBg
    val info: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.info else Light.info
    val infoBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.infoBg else Light.infoBg
    val sold: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.sold else Light.sold
    val soldBg: Color @Composable @ReadOnlyComposable get() = if (dark) Dark.soldBg else Light.soldBg

    // Legacy aliases — same role, old name, so call sites compile unchanged.
    val background: Color @Composable @ReadOnlyComposable get() = ground
    val surfaceCanvas: Color @Composable @ReadOnlyComposable get() = card
    val surfaceCard: Color @Composable @ReadOnlyComposable get() = card
    val mist: Color @Composable @ReadOnlyComposable get() = surface2
    val secondary: Color @Composable @ReadOnlyComposable get() = surface2
    val foreground: Color @Composable @ReadOnlyComposable get() = text
    val secondaryForeground: Color @Composable @ReadOnlyComposable get() = text
    val inkBlack: Color @Composable @ReadOnlyComposable get() = text
    val onyx: Color @Composable @ReadOnlyComposable get() = text
    val mutedForeground: Color @Composable @ReadOnlyComposable get() = muted
    val slate: Color @Composable @ReadOnlyComposable get() = muted
    val ash: Color @Composable @ReadOnlyComposable get() = sold // marks inactive / absent
    val hairline: Color @Composable @ReadOnlyComposable get() = border
    val bone: Color @Composable @ReadOnlyComposable get() = border
    val primary: Color @Composable @ReadOnlyComposable get() = action
    val primaryForeground: Color @Composable @ReadOnlyComposable get() = onAction
    val destructive: Color @Composable @ReadOnlyComposable get() = danger
    val dangerSurface: Color @Composable @ReadOnlyComposable get() = dangerBg

    // Fixed accents still consumed by feature charts / ledgers (not Warm Card roles).
    val signalBlue = Color(0xFF2F6FDB) // consigned / OUT accent in nasiya & sales
    val brandViolet = Color(0xFF6647F0)
    val emerald = Color(0xFF00C07A)
    val mercury = Color(0xFFEEEEEE)

    /**
     * Layout density — the single source of truth for spacing (DESIGN.md: scale
     * 4, 8, 12, 16, 20; 48 dp rows, 52 dp controls, 20 dp gutters). Feature
     * screens and `shared/ui` read these instead of ad-hoc literals.
     */
    object Space {
        val xs = 4.dp
        val sm = 8.dp
        val md = 12.dp
        val lg = 16.dp
        val gutter = 20.dp
        val cardPad = 20.dp

        val screenH = gutter    // screen horizontal gutter
        val section = lg        // gap between major sections / cards
        val cardInner = cardPad // card / tile inner padding
        val rowV = sm           // list-row vertical rhythm
        val gap = sm            // small inline gap
        val chipH = md          // status chip horizontal padding
        val chipV = xs          // status chip vertical padding
        val buttonH = gutter    // button horizontal padding
        val buttonV = 14.dp     // button vertical padding
        val listBottom = 24.dp  // bottom inset for a list with no FAB
        val fabClearance = 88.dp // bottom inset for a list under a FAB
    }

    /** Minimum touch target — Material's 48 dp, enforced in the theme. */
    val minTouch = 48.dp

    /** Corner radii (DESIGN.md): cards 16, inputs/controls 12, buttons 14, pill 999. */
    object Radius {
        val cards = 16.dp
        val inputs = 12.dp
        val controls = 12.dp
        val buttons = 14.dp
        val large = 20.dp
        val pill = 999.dp
    }

    // Legacy radius aliases (still read by feature charts).
    val radiusInputs = Radius.inputs
    val radiusCards = Radius.cards
    val radiusFull = Radius.pill

    // Caldera chart palette (fixed role order; charts never use the action orange).
    val chart = listOf(
        Color(0xFF2A78D6), Color(0xFFEB6834), Color(0xFF1BAF7A), Color(0xFFEDA100),
        Color(0xFFE87BA4), Color(0xFF008300), Color(0xFF6250D6), Color(0xFFE34948),
    )
}
