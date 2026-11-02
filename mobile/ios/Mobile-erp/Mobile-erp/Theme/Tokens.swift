import SwiftUI

/// Caldera design tokens — mirrored from `client/src/app/styles/index.css`
/// (same names, camelCase). Change a value here, nowhere else.
///
/// Identity is near-monochrome: the app tint is ink-black (NOT violet). Brand
/// and status hues are fixed (they read on both appearances); surfaces and text
/// use SwiftUI's system semantic colors so Dark Mode adapts for free.
enum Tokens {
    // Raw palette (`--color-*`).
    static let signalWhite = Color(hex: 0xFFFFFF)
    static let inkBlack = Color(hex: 0x202020)
    static let onyx = Color(hex: 0x090C1D)
    static let slate = Color(hex: 0x646464)
    static let ash = Color(hex: 0x838383)
    static let cloud = Color(hex: 0xD4D4D4)
    static let bone = Color(hex: 0xE8E8E8)
    static let mist = Color(hex: 0xF8F9FA)

    static let brandViolet = Color(hex: 0x6647F0)
    static let signalBlue = Color(hex: 0x0091FF)
    static let emerald = Color(hex: 0x00C07A)
    static let destructive = Color(hex: 0xE53935)

    /// Admin status accents (emerald / amber / rose) — not the marketing hues.
    static let success = Color(hex: 0x059669)
    static let warning = Color(hex: 0xD97706)
    static let danger = Color(hex: 0xE11D48)

    /// `--color-ring` (focus) = signal-blue.
    static let ring = signalBlue

    /// App tint = ink-black, lifted to near-white in Dark Mode so it stays
    /// legible on dark chrome. The one adaptive brand color.
    static let ink = Color(light: 0x202020, dark: 0xF2F2F2)

    /// Hairline border — bone in light, system separator in dark.
    static let hairline = Color(light: 0xE8E8E8, dark: 0x3A3A3C)

    // Named radii (`--radius-*`), in points.
    enum Radius {
        static let inputs: CGFloat = 9
        static let cards: CGFloat = 12
        static let large: CGFloat = 20
        static let pill: CGFloat = 9999
    }

    /// Device status code → accent, matching the web `DeviceStatusBadge`.
    static func deviceStatusColor(_ code: String) -> Color {
        switch code.uppercased() {
        case "IN_STOCK": return emerald
        case "DEFECTIVE": return destructive
        case "CONSIGNED": return signalBlue
        case "SOLD": return slate
        default: return slate
        }
    }
}

extension Font {
    /// Sometype Mono (bundled TTF) for IMEI and money columns; SwiftUI falls
    /// back to the system monospaced face if the font fails to load.
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Sometype Mono", size: size).weight(weight)
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
