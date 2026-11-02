import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'tokens.dart';

/// Builds the Caldera [ThemeData] from the design tokens.
///
/// Semantic mapping mirrors the shadcn `--*` variables in index.css:
/// primary = ink-black, muted/secondary = mist, border = bone, ring = signal-blue.
/// Only a light theme exists — the web app ships no dark block.
class AppTheme {
  AppTheme._();

  static ThemeData get light {
    const scheme = ColorScheme.light(
      primary: AppColors.inkBlack,
      onPrimary: AppColors.signalWhite,
      secondary: AppColors.mist,
      onSecondary: AppColors.inkBlack,
      surface: AppColors.surfaceCanvas,
      onSurface: AppColors.inkBlack,
      surfaceContainerLowest: AppColors.surfaceCanvas,
      surfaceContainerLow: AppColors.surfaceCard,
      surfaceContainer: AppColors.surfaceCard,
      surfaceContainerHigh: AppColors.plaster,
      onSurfaceVariant: AppColors.slate, // muted-foreground
      error: AppColors.destructive,
      onError: AppColors.signalWhite,
      outline: AppColors.bone, // border / input
      outlineVariant: AppColors.cloud,
      tertiary: AppColors.brandViolet,
      onTertiary: AppColors.signalWhite,
    );

    final text = _textTheme(scheme);

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.surfaceCard, // body bg in index.css
      canvasColor: AppColors.surfaceCanvas,
      textTheme: text,
      fontFamily: GoogleFonts.inter().fontFamily,
      focusColor: AppColors.signalBlue, // ring

      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.cards),
          side: const BorderSide(color: AppColors.bone),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: _pillButton(
          background: scheme.primary,
          foreground: scheme.onPrimary,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: _pillButton(
          background: scheme.primary,
          foreground: scheme.onPrimary,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: _pillButton(
          background: Colors.transparent,
          foreground: scheme.onSurface,
        ).copyWith(
          side: const WidgetStatePropertyAll(
            BorderSide(color: AppColors.bone),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: _pillButton(
          background: Colors.transparent,
          foreground: scheme.onSurface,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        hintStyle: text.bodyMedium?.copyWith(color: AppColors.ash),
        border: _inputBorder(AppColors.bone),
        enabledBorder: _inputBorder(AppColors.bone),
        focusedBorder: _inputBorder(AppColors.signalBlue, width: 1.5),
        errorBorder: _inputBorder(AppColors.destructive),
        focusedErrorBorder: _inputBorder(AppColors.destructive, width: 1.5),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: AppColors.mist,
        labelStyle: text.bodySmall,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.tags),
        ),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.bone,
        thickness: 1,
        space: 1,
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: scheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.largeCards),
        ),
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surfaceCanvas,
        shape: RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(AppRadii.largeCards)),
        ),
      ),

      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surfaceCanvas,
        foregroundColor: AppColors.onyx,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: text.titleLarge,
      ),
    );
  }

  static ButtonStyle _pillButton({
    required Color background,
    required Color foreground,
  }) {
    return ButtonStyle(
      backgroundColor: WidgetStatePropertyAll(background),
      foregroundColor: WidgetStatePropertyAll(foreground),
      elevation: const WidgetStatePropertyAll(0),
      padding: const WidgetStatePropertyAll(
        EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      ),
      textStyle: WidgetStatePropertyAll(
        GoogleFonts.inter(fontSize: AppFontSizes.bodySm, fontWeight: FontWeight.w600),
      ),
      shape: const WidgetStatePropertyAll(
        StadiumBorder(), // radius-buttons: 9999 (pill)
      ),
    );
  }

  static OutlineInputBorder _inputBorder(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadii.inputs),
      borderSide: BorderSide(color: color, width: width),
    );
  }

  /// Headings use Plus Jakarta Sans (weight 700, tight tracking, 1.2 leading);
  /// body uses Inter (1.5 leading). `-0.035em` tracking → size * -0.035 px.
  static TextTheme _textTheme(ColorScheme scheme) {
    TextStyle heading(double size) => GoogleFonts.plusJakartaSans(
          fontSize: size,
          fontWeight: FontWeight.w700,
          height: 1.2,
          letterSpacing: size * -0.035,
          color: AppColors.onyx,
        );

    TextStyle body(double size, {FontWeight weight = FontWeight.w400}) =>
        GoogleFonts.inter(
          fontSize: size,
          fontWeight: weight,
          height: 1.5,
          color: scheme.onSurface,
        );

    return TextTheme(
      displayLarge: heading(AppFontSizes.display), // 80
      displayMedium: heading(AppFontSizes.headingLg), // 60
      displaySmall: heading(AppFontSizes.heading), // 48
      headlineMedium: heading(AppFontSizes.headingSm), // 34
      headlineSmall: heading(AppFontSizes.subheading),
      titleLarge: GoogleFonts.plusJakartaSans(
        fontSize: AppFontSizes.subheading, // 20
        fontWeight: FontWeight.w700,
        height: 1.3,
        letterSpacing: AppFontSizes.subheading * -0.035,
        color: AppColors.onyx,
      ),
      titleMedium: body(AppFontSizes.body, weight: FontWeight.w600),
      bodyLarge: body(AppFontSizes.body), // 16
      bodyMedium: body(AppFontSizes.bodySm), // 14
      labelLarge: body(AppFontSizes.bodySm, weight: FontWeight.w600),
      labelMedium: body(12),
      bodySmall: body(12).copyWith(color: AppColors.slate),
    );
  }
}
