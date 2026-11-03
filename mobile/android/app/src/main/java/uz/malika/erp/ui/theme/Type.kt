package uz.malika.erp.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import uz.malika.erp.R

/**
 * Ink fonts, bundled as static TTFs in `res/font` (OFL, from github.com/IBM/plex):
 * IBM Plex Sans for all UI text, IBM Plex Mono for IMEI/money/counts (tabular).
 * [DisplayFamily] and [BodyFamily] both resolve to the sans family — Ink uses one
 * UI typeface — keeping the names call sites already import.
 */
val SansFamily = FontFamily(
    Font(R.font.ibm_plex_sans_regular, FontWeight.W400),
    Font(R.font.ibm_plex_sans_medium, FontWeight.W500),
    Font(R.font.ibm_plex_sans_semibold, FontWeight.W600),
    Font(R.font.ibm_plex_sans_bold, FontWeight.W700),
)

val DisplayFamily = SansFamily
val BodyFamily = SansFamily

val MonoFamily = FontFamily(
    Font(R.font.ibm_plex_mono_regular, FontWeight.W400),
    Font(R.font.ibm_plex_mono_medium, FontWeight.W500),
)

/**
 * Headings: IBM Plex Sans 700, tight tracking (-0.035em), 1.2 line height.
 * Colour is left unspecified so text inherits the adaptive M3 content colour
 * (onSurface/onBackground), which flips with light/dark.
 */
private fun heading(size: TextUnit) = TextStyle(
    fontFamily = DisplayFamily,
    fontWeight = FontWeight.W700,
    fontSize = size,
    lineHeight = size * 1.2f,
    letterSpacing = (-0.035).em,
)

// Line height 1.35 (not Material's airier 1.5): IBM Plex Sans has a tall x-height,
// so 1.5 stacks rows taller than iOS SF text — 1.35 matches the iOS line density.
private fun body(size: TextUnit, weight: FontWeight = FontWeight.W400) = TextStyle(
    fontFamily = BodyFamily,
    fontWeight = weight,
    fontSize = size,
    lineHeight = size * 1.35f,
)

/** Material3 [Typography] mapped from the Ink type scale. */
val calderaTypography = Typography(
    displayLarge = heading(Tokens.textDisplay),
    displayMedium = heading(Tokens.textHeadingLg),
    displaySmall = heading(Tokens.textHeading),
    headlineMedium = heading(Tokens.textHeadingSm),
    headlineSmall = heading(Tokens.textSubheading),
    titleLarge = heading(Tokens.textSubheading),
    titleMedium = body(Tokens.textBody, FontWeight.W600),
    titleSmall = body(Tokens.textBodySm, FontWeight.W600),
    bodyLarge = body(Tokens.textBody),
    bodyMedium = body(Tokens.textBodySm),
    bodySmall = body(12.sp),
    labelLarge = body(Tokens.textBodySm, FontWeight.W600),
    labelMedium = body(12.sp),
)
