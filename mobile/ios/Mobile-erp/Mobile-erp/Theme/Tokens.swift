import SwiftUI

/// Caldera design tokens — the "Ink" mobile theme.
///
/// Source of truth: `docs/design/mobile-themes/theme-01-ink.html` (its `:root`
/// and dark blocks and the token table). The same values drive `Tokens.kt` on
/// Android. Change a value here, nowhere else.
///
/// Identity is pure monochrome: surfaces go white → near-black, text is ink,
/// the app tint is ink (lifted to near-white in Dark Mode). The only colour on
/// screen is status (ok / warn / bad / info). No shadows; 1 px hairline borders.
enum Tokens {
    // Surfaces & text (adaptive light → dark).

    /// Screen background (`bg`).
    static let bg = Color(light: 0xFFFFFF, dark: 0x0A0A0A)

    /// Cards, lists, tab bar (`surface`).
    static let surface = Color(light: 0xFFFFFF, dark: 0x141414)

    /// Chips, segmented control, inputs (`surface2`). Historic name: `mist`.
    static let mist = Color(light: 0xF1F1F2, dark: 0x1F1F1F)
    static let surface2 = mist

    /// Primary text (`fg`) and the app tint (`accent`) — identical in Ink, so
    /// one adaptive token serves both.
    static let ink = Color(light: 0x202020, dark: 0xF2F2F2)

    /// Foreground placed on an `ink`/accent fill (`on-accent`); inverts so the
    /// label always contrasts.
    static let onInk = Color(light: 0xFFFFFF, dark: 0x141414)

    /// Secondary text, captions (`muted`). Historic name: `slate`.
    static let slate = Color(light: 0x6B6B6B, dark: 0x9B9B9B)

    /// Inactive / tertiary marker. Not a themed Ink token; a fixed mid-grey
    /// that reads on both appearances.
    static let ash = Color(hex: 0x838383)

    /// Dividers, hairline borders (`hair`).
    static let hairline = Color(light: 0xE6E6E6, dark: 0x262626)

    // Status hues (`ok` / `warn` / `bad` / `info`) — the only colour on screen.
    static let success = Color(light: 0x059669, dark: 0x34D399)
    static let warning = Color(light: 0xD97706, dark: 0xFBBF24)
    static let danger = Color(light: 0xE11D48, dark: 0xFB7185)
    /// Info blue (`info`), also the `CONSIGNED` device status and focus ring.
    static let signalBlue = Color(light: 0x0A84FF, dark: 0x5AAAFF)

    /// Error text / destructive copy — same hue as `danger`.
    static let destructive = danger

    // Status tint backgrounds for pills (`ok-bg` / `warn-bg` / `bad-bg` / `info-bg`).
    static let okBg = Color(light: 0xE6F6EF, dark: 0x0F2A20)
    static let warnBg = Color(light: 0xFBF0DC, dark: 0x2E2410)
    static let badBg = Color(light: 0xFCE7EC, dark: 0x331520)
    static let infoBg = Color(light: 0xE3F0FF, dark: 0x10243A)

    /// `--color-ring` (focus) = info blue.
    static let ring = signalBlue

    // Named radii (`--radius-*`), in points.
    enum Radius {
        static let inputs: CGFloat = 10
        static let cards: CGFloat = 12
        static let large: CGFloat = 20
        static let pill: CGFloat = 9999
    }

    /// Device status code → status hue (matches the web `DeviceStatusBadge`).
    static func deviceStatusColor(_ code: String) -> Color {
        switch code.uppercased() {
        case "IN_STOCK": return success
        case "DEFECTIVE": return danger
        case "CONSIGNED": return signalBlue
        case "SOLD": return slate
        default: return slate
        }
    }

    /// Pill/tile tint background paired with a status hue (Ink `*-bg`). Non-status
    /// hues (muted/inactive) fall back to the neutral chip surface. Call sites pass
    /// the raw `Tokens` hue, so identity comparison resolves the pair.
    static func pillTint(_ hue: Color) -> Color {
        if hue == success { return okBg }
        if hue == warning { return warnBg }
        if hue == danger { return badBg }
        if hue == signalBlue { return infoBg }
        return surface2
    }
}

extension Font {
    /// IBM Plex Mono (bundled TTF) for IMEI, money and count columns; SwiftUI
    /// falls back to the system monospaced face if the font fails to load.
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("IBM Plex Mono", size: size).weight(weight)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }

    /// Appearance-adaptive color from two hex values.
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(
                red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255,
                alpha: 1
            )
        })
    }
}
