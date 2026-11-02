import 'package:flutter/painting.dart';

/// Caldera design tokens — the single source of truth, mirrored from
/// `client/src/app/styles/index.css`. Change a value here, nowhere else.
///
/// Raw palette, named radii, shadow stacks and the type scale. Semantic
/// mapping (ColorScheme / TextTheme) lives in `app_theme.dart`.

/// Raw brand palette (the `--color-*` custom properties).
class AppColors {
  AppColors._();

  static const signalWhite = Color(0xFFFFFFFF);
  static const inkBlack = Color(0xFF202020);
  static const onyx = Color(0xFF090C1D);
  static const carbon = Color(0xFF2A2A2A);
  static const slate = Color(0xFF646464);
  static const ash = Color(0xFF838383);
  static const fog = Color(0xFFB3B3B3);
  static const cloud = Color(0xFFD4D4D4);
  static const bone = Color(0xFFE8E8E8);
  static const mist = Color(0xFFF8F9FA);
  static const plaster = Color(0xFFE9EBF0);
  static const mercury = Color(0xFFEEEEEE);

  static const brandViolet = Color(0xFF6647F0);
  static const signalBlue = Color(0xFF0091FF);
  static const mint = Color(0xFF6EE7B7);
  static const emerald = Color(0xFF00C07A);
  static const tealTag = Color(0xFF16C0A4);
  static const primaryGradient = Color(0xFF40DDFF);
  static const darkFade = Color(0xFF111111);

  static const destructive = Color(0xFFE53935);

  // Status accents actually used across the admin UI. These are Tailwind
  // defaults (emerald/amber/rose), NOT the marketing brand tokens above —
  // the admin panel itself is monochrome + these for success/warn/danger.
  static const success = Color(0xFF059669); // emerald-600
  static const warning = Color(0xFFD97706); // amber-600
  static const danger = Color(0xFFE11D48); // rose-600
  static const dangerSurface = Color(0xFFFFF1F2); // rose-50

  // Surfaces (the `--surface-*` custom properties).
  static const surfaceCanvas = Color(0xFFFFFFFF);
  static const surfaceCard = Color(0xFFF8F9FA);
  static const surfaceSectionBand = Color(0xFFE9EBF0);
  static const surfaceDarkPanel = Color(0xFF111111);
  static const surfaceInk = Color(0xFF000000);
}

/// Signature gradients (`--gradient-*`).
class AppGradients {
  AppGradients._();

  /// `--gradient-primary-gradient`: linear 83deg cyan → violet → magenta.
  static const primary = LinearGradient(
    begin: Alignment(-1.0, -0.2),
    end: Alignment(1.0, 0.2),
    colors: [Color(0xFF40DDFF), Color(0xFF7612FA), Color(0xFFFA12E3)],
    stops: [0.0, 0.51, 1.0],
  );

  /// `--gradient-dark-fade`: near-black vertical fade.
  static const darkFade = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF111111), Color(0xFF000000)],
    stops: [0.24, 1.0],
  );

  /// `--gradient-rainbow-conic`: the animated conic border sweep.
  static const rainbowConic = SweepGradient(
    colors: [
      Color(0xFF7D5BE7),
      Color(0xFFBC3FDA),
      Color(0xFFFA24CE),
      Color(0xFFFB49A5),
      Color(0xFFFC6D7B),
      Color(0xFFFD8461),
      Color(0xFFFD9A46),
      Color(0xFFF687C6),
      Color(0xFFA3A0E0),
      Color(0xFF4FB9FA),
      Color(0xFF0091FF),
    ],
    stops: [0.19, 0.28, 0.37, 0.45, 0.52, 0.55, 0.58, 0.65, 0.80, 0.95, 1.0],
  );
}

/// Named corner radii (`--radius-*`).
class AppRadii {
  AppRadii._();

  static const inputs = 9.0;
  static const cards = 12.0;
  static const images = 16.0;
  static const largeCards = 20.0;
  static const tags = 100.0;
  static const full = 9999.0; // buttons / badges — pill
}

/// Type scale in logical pixels (`--text-*`).
class AppFontSizes {
  AppFontSizes._();

  static const bodySm = 14.0;
  static const body = 16.0;
  static const subheading = 20.0;
  static const headingSm = 34.0;
  static const heading = 48.0;
  static const headingLg = 60.0;
  static const display = 80.0;
}

/// Font families as registered with google_fonts.
class AppFonts {
  AppFonts._();

  static const display = 'Plus Jakarta Sans'; // headings
  static const body = 'Inter'; // body text
  static const mono = 'Sometype Mono'; // numbers / code / receipts
}

/// Soft Caldera shadow system (`--shadow-*`), as Flutter [BoxShadow] stacks.
class AppShadows {
  AppShadows._();

  static const xs = [
    BoxShadow(color: Color(0x0A000000), offset: Offset(0, 1), blurRadius: 2),
  ];

  static const sm = [
    BoxShadow(color: Color(0x0D000000), offset: Offset(0, 1), blurRadius: 3),
    BoxShadow(
      color: Color(0x08000000),
      offset: Offset(0, 1),
      blurRadius: 2,
      spreadRadius: -1,
    ),
  ];

  static const subtle = sm;

  static const subtle2 = [
    BoxShadow(
      color: Color(0x0F000000),
      offset: Offset(0, 4),
      blurRadius: 16,
      spreadRadius: -2,
    ),
    BoxShadow(color: Color(0x08000000), offset: Offset(0, 1), blurRadius: 3),
  ];

  static const md = [
    BoxShadow(
      color: Color(0x0F000000),
      offset: Offset(0, 4),
      blurRadius: 12,
      spreadRadius: -2,
    ),
    BoxShadow(
      color: Color(0x08000000),
      offset: Offset(0, 2),
      blurRadius: 6,
      spreadRadius: -1,
    ),
  ];

  static const lg = [
    BoxShadow(
      color: Color(0x14000000),
      offset: Offset(0, 10),
      blurRadius: 25,
      spreadRadius: -4,
    ),
    BoxShadow(
      color: Color(0x08000000),
      offset: Offset(0, 4),
      blurRadius: 10,
      spreadRadius: -3,
    ),
  ];

  static const xl = [
    BoxShadow(
      color: Color(0x1A000000),
      offset: Offset(0, 20),
      blurRadius: 35,
      spreadRadius: -8,
    ),
    BoxShadow(color: Color(0x0A000000), blurRadius: 1, spreadRadius: 1),
  ];

  static const xl2 = [
    BoxShadow(
      color: Color(0x29000000),
      offset: Offset(0, 25),
      blurRadius: 50,
      spreadRadius: -12,
    ),
  ];
}
