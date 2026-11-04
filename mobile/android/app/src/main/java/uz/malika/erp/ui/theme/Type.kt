@file:OptIn(ExperimentalTextApi::class)

package uz.malika.erp.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.ExperimentalTextApi
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
 * Warm Card fonts (OFL, bundled in `res/font`): Onest for all UI text, Sometype
 * Mono for IMEI / money / counts (tabular). Both are variable TTFs; each weight
 * loads the one file with a `wght` variation setting. Variation settings apply on
 * API 26+; on API 24–25 (the floor) the variable font falls back to its default
 * instance — acceptable, the ramp still reads with correct sizes and spacing.
 * License texts: `mobile/android/licenses/{onest,sometype_mono}_ofl.txt`.
 */
private fun onest(weight: Int) =
    Font(R.font.onest, weight = FontWeight(weight), variationSettings = FontVariation.Settings(FontVariation.weight(weight)))

private fun sometype(weight: Int) =
    Font(R.font.sometype_mono, weight = FontWeight(weight), variationSettings = FontVariation.Settings(FontVariation.weight(weight)))

val SansFamily = FontFamily(onest(400), onest(500), onest(600), onest(700))

val MonoFamily = FontFamily(sometype(400), sometype(500))

/** Tabular numerals everywhere so a cashier can compare and copy figures. */
private const val TABULAR = "tnum"

private fun style(
    size: TextUnit,
    weight: FontWeight,
    lineHeight: Float = 1.3f,
    letterSpacing: TextUnit = 0.em,
    family: FontFamily = SansFamily,
) = TextStyle(
    fontFamily = family,
    fontWeight = weight,
    fontSize = size,
    lineHeight = size * lineHeight,
    letterSpacing = letterSpacing,
    fontFeatureSettings = TABULAR,
)

/** Data Large (DESIGN.md): headline amounts and totals — 24 sp mono 500. */
val DataLarge = style(24.sp, FontWeight.W500, lineHeight = 1.2f, letterSpacing = (-0.01).em, family = MonoFamily)

/**
 * Material3 [Typography] mapped from the Warm Card ramp (DESIGN.md Typography).
 * Colour is left unspecified so text inherits the adaptive M3 content colour,
 * which flips with light/dark. Headline/display roles reuse the title sizes at
 * 24/28 700 for the rare dashboard number.
 */
val calderaTypography = Typography(
    displayLarge = style(28.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    displayMedium = style(28.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    displaySmall = style(24.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    headlineLarge = style(28.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    headlineMedium = style(28.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    headlineSmall = style(24.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    titleLarge = style(22.sp, FontWeight.W700, lineHeight = 1.2f, letterSpacing = (-0.01).em),
    titleMedium = style(17.sp, FontWeight.W600, lineHeight = 1.25f),
    titleSmall = style(15.sp, FontWeight.W600, lineHeight = 1.3f),
    bodyLarge = style(16.sp, FontWeight.W400, lineHeight = 1.35f),
    bodyMedium = style(15.sp, FontWeight.W400, lineHeight = 1.35f),
    bodySmall = style(13.sp, FontWeight.W400, lineHeight = 1.3f),
    labelLarge = style(13.sp, FontWeight.W600, lineHeight = 1.2f),
    labelMedium = style(12.sp, FontWeight.W600, lineHeight = 1.2f, letterSpacing = 0.01.em),
    labelSmall = style(11.sp, FontWeight.W600, lineHeight = 1.2f),
)
