import UIKit
import CoreText

/// The one place the `wght` variation axis is set on a bundled variable TTF.
///
/// On iOS 17 a variable font loaded from the app bundle exposes only its default
/// (Regular) instance to `Font.custom(_:).weight(_)`, which does not interpolate
/// the axis, and the named instances are not separately addressable. Setting the
/// `wght` axis explicitly on a `UIFontDescriptor` is the reliable path.
enum VariableFont {
    private static let wght = 0x77676874 // 'wght' four-char code
    private static let variationKey = UIFontDescriptor.AttributeName(
        rawValue: kCTFontVariationAttribute as String)

    /// A UIFont at `weight`, size-scaled to `textStyle` for Dynamic Type.
    static func make(_ family: String, size: CGFloat, weight: CGFloat,
                     textStyle: UIFont.TextStyle) -> UIFont {
        UIFontMetrics(forTextStyle: textStyle).scaledFont(for: fixed(family, size: size, weight: weight))
    }

    /// A UIFont at `weight` and a fixed point size (no Dynamic Type) — for the
    /// UIKit bar appearances, which take a concrete font.
    static func fixed(_ family: String, size: CGFloat, weight: CGFloat) -> UIFont {
        let descriptor = UIFontDescriptor(fontAttributes: [
            .name: family,
            variationKey: [wght: weight],
        ])
        return UIFont(descriptor: descriptor, size: size)
    }
}
