package uz.malika.erp.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import uz.malika.erp.R

/**
 * Caldera fonts, bundled as variable TTFs in `res/font` (OFL, from google/fonts):
 * Plus Jakarta Sans for display/headings, Inter for body, Sometype Mono for
 * IMEI/money. Weights are selected via [FontVariation] off the single variable
 * file per family (applied on API 26+, graceful default below).
 */
@OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)
private fun wght(resId: Int, weight: Int) = Font(
    resId,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

val DisplayFamily = FontFamily(
    wght(R.font.plus_jakarta_sans, 400),
    wght(R.font.plus_jakarta_sans, 600),
    wght(R.font.plus_jakarta_sans, 700),
    wght(R.font.plus_jakarta_sans, 800),
)

val BodyFamily = FontFamily(
    wght(R.font.inter, 400),
    wght(R.font.inter, 500),
    wght(R.font.inter, 600),
    wght(R.font.inter, 700),
)

val MonoFamily = FontFamily(
    wght(R.font.sometype_mono, 400),
    wght(R.font.sometype_mono, 500),
)

/** Headings: Plus Jakarta Sans 700, tight tracking (-0.035em), 1.2 line height. */
private fun heading(size: TextUnit) = TextStyle(
    fontFamily = DisplayFamily,
    fontWeight = FontWeight.W700,
    fontSize = size,
    lineHeight = size * 1.2f,
    letterSpacing = (-0.035).em,
    color = Tokens.onyx,
)

private fun body(size: TextUnit, weight: FontWeight = FontWeight.W400) = TextStyle(
    fontFamily = BodyFamily,
    fontWeight = weight,
    fontSize = size,
    lineHeight = size * 1.5f,
    color = Tokens.foreground,
)

/** Material3 [Typography] mapped from the Caldera type scale. */
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
    bodySmall = body(12.sp).copy(color = Tokens.slate),
    labelLarge = body(Tokens.textBodySm, FontWeight.W600),
    labelMedium = body(12.sp),
)
