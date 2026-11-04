import SwiftUI

/// Warm Card design tokens — the shared mobile system (DESIGN.md, ADR 0022).
///
/// Source of truth: repo-root `DESIGN.md` (its colour table, type ramp, spacing
/// scale and radii). The same values drive `Tokens.kt` on Android. Change a
/// value here, nowhere else.
///
/// Identity: a warm tinted `ground`, white `card`s with no border or shadow,
/// one `action` orange reserved for pressable things (primary action, active
/// tab), status hues (`success`/`danger`/`warning`/`info`/`sold`) the only
/// other colour. The type ramp lives in `Typography.swift`.
///
/// The names below `// MARK: Legacy aliases` map the old Ink token names onto
/// the warm palette so existing call sites compile. New code uses the warm
/// names (`ground`/`card`/`text`/`action`/…), never the aliases.
enum Tokens {
    // MARK: Neutrals (adaptive light → dark)
    static let ground = Color(light: 0xFBF6EE, dark: 0x1C1713)
    static let card = Color(light: 0xFFFFFF, dark: 0x2A231D)
    static let surface2 = Color(light: 0xF4ECDF, dark: 0x352C24)
    static let border = Color(light: 0xE7DACB, dark: 0x3A312A)
    static let text = Color(light: 0x2B2B2B, dark: 0xF4EDE4)
    static let muted = Color(light: 0x8A8378, dark: 0xA89C8E)

    // MARK: Action — the one orange (never on text, icons or status)
    static let action = Color(hex: 0xFF5A1F)
    static let actionPressed = Color(hex: 0xE64D15)
    static let onAction = Color(hex: 0xFFFFFF)

    // MARK: Status hues + pill tints
    // Dark tints verified ≥ 4.5:1 against their dark text hue (see Theme/README.md).
    static let success = Color(light: 0x12603A, dark: 0x3DB876)
    static let successBg = Color(light: 0xE3F5EA, dark: 0x0B3F24)
    static let danger = Color(light: 0xAB1E30, dark: 0xF28F9B)
    static let dangerBg = Color(light: 0xFBE3E6, dark: 0x7E1626)
    static let warning = Color(light: 0x7A4D00, dark: 0xF0A633)
    static let warningBg = Color(light: 0xFCEFD6, dark: 0x4D3100)
    static let info = Color(light: 0x2455AD, dark: 0x5C8FE5)
    static let infoBg = Color(light: 0xE4ECFB, dark: 0x10264F)
    static let sold = Color(light: 0x5E5E5E, dark: 0xA89C8E)
    static let soldBg = Color(light: 0xEFEAE2, dark: 0x352C24)

    /// Error text / destructive copy — same hue as `danger`.
    static let destructive = danger

    // MARK: Legacy aliases (old Ink names → warm roles; new code must not use these)
    static let bg = ground
    static let surface = card
    static let mist = surface2
    static let hairline = border
    static let ink = text        // the app tint is now `action`, not `ink`
    static let onInk = onAction
    static let slate = muted
    static let ash = sold
    static let signalBlue = info
    static let ring = text        // field focus ring is text at 2 pt, never orange
    static let okBg = successBg
    static let warnBg = warningBg
    static let badBg = dangerBg

    // MARK: Spacing scale (points) — nothing off this scale
    enum Space {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let gutter: CGFloat = 20
        static let cardPad: CGFloat = 20
        static let controlH: CGFloat = 52
        static let rowH: CGFloat = 48
        static let minTouch: CGFloat = 44
    }

    // MARK: Corner radii (points)
    enum Radius {
        static let cards: CGFloat = 16
        static let controls: CGFloat = 12
        static let buttons: CGFloat = 14
        static let pill: CGFloat = 999
        // Legacy aliases.
        static let inputs: CGFloat = controls
        static let large: CGFloat = cards
    }

    /// Device status code → status hue (matches the web `DeviceStatusBadge`).
    static func deviceStatusColor(_ code: String) -> Color {
        switch code.uppercased() {
        case "IN_STOCK": return success
        case "DEFECTIVE": return danger
        case "CONSIGNED": return info
        case "SOLD": return sold
        default: return muted
        }
    }

    /// Pill/tile tint background paired with a status hue. Non-status hues fall
    /// back to the neutral chip surface. Call sites pass the raw `Tokens` hue, so
    /// identity comparison resolves the pair.
    static func pillTint(_ hue: Color) -> Color {
        if hue == success { return successBg }
        if hue == warning { return warningBg }
        if hue == danger { return dangerBg }
        if hue == info { return infoBg }
        if hue == sold { return soldBg }
        return surface2
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
