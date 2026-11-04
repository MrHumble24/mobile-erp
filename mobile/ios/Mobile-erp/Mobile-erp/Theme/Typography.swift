import SwiftUI
import UIKit

/// The Warm Card type ramp (DESIGN.md): Onest for UI, Sometype Mono for data.
///
/// Both faces are bundled **variable** TTFs (one file per family, `wght` axis).
/// On iOS 17 a bundled variable font exposes only its default (Regular) instance
/// to `Font.custom(_:).weight(_)`, which does not interpolate the axis — the
/// named weights are not separately addressable either. So each style sets the
/// `wght` variation axis explicitly on a `UIFontDescriptor`, then scales the
/// result with `UIFontMetrics` for the matching text style (the `relativeTo:`
/// equivalent) so every size follows Dynamic Type. This is the documented,
/// reliable path for app-bundled variable fonts.
extension Font {
    enum UIStyle { case title, heading, body, bodyStrong, caption, label }

    static func ui(_ style: UIStyle) -> Font {
        switch style {
        case .title:      return onest(22, 700, .title2)
        case .heading:    return onest(17, 600, .headline)
        case .body:       return onest(16, 400, .body)
        case .bodyStrong: return onest(16, 600, .body)
        case .caption:    return onest(13, 400, .footnote)
        case .label:      return onest(12, 600, .caption1)
        }
    }

    enum DataStyle { case regular, large }

    static func data(_ style: DataStyle) -> Font {
        switch style {
        case .regular: return mono(15, relativeTo: .body, weight: 400)
        case .large:   return mono(24, relativeTo: .title2, weight: 500)
        }
    }

    /// Dynamic-Type-safe mono (Sometype Mono, tabular). Same signature as the old
    /// fixed-size helper so the existing call sites compile; it now scales.
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        mono(size, relativeTo: .body, weight: weightAxis(weight))
    }

    // MARK: - Variable-font construction

    private static func onest(_ size: CGFloat, _ weight: CGFloat, _ style: UIFont.TextStyle) -> Font {
        scaled("Onest", size: size, weight: weight, style: style)
    }

    private static func mono(_ size: CGFloat, relativeTo style: UIFont.TextStyle, weight: CGFloat) -> Font {
        scaled("Sometype Mono", size: size, weight: weight, style: style).monospacedDigit()
    }

    /// `wght` axis (`'wght'` four-char code) set on the descriptor, then
    /// `UIFontMetrics`-scaled. Falls back to the system face if the family is
    /// missing (SwiftUI does this silently — no crash).
    private static func scaled(_ name: String, size: CGFloat, weight: CGFloat, style: UIFont.TextStyle) -> Font {
        Font(VariableFont.make(name, size: size, weight: weight, textStyle: style))
    }

    private static func weightAxis(_ weight: Font.Weight) -> CGFloat {
        switch weight {
        case .medium: return 500
        case .semibold: return 600
        case .bold, .heavy, .black: return 700
        default: return 400
        }
    }
}
