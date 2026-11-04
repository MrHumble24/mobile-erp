import SwiftUI
import UIKit

/// Themes the UIKit chrome SwiftUI still renders (tab bar + navigation bar) from
/// the Warm Card palette, once at launch. The tab bar sits on `card` with the
/// active item in `action`; the navigation bar carries Onest titles in `text`
/// on `ground` (SwiftUI's `.toolbarBackground` supplies the bar fill too).
///
/// Colours are **direct dynamic `UIColor`s** from the DESIGN.md hex (the one
/// UIKit boundary); `UIColor(someSwiftUIColor)` does not resolve in a bar text
/// attribute. Title fonts are bundled Onest via `VariableFont`.
enum AppAppearance {
    static func apply() {
        configureTabBar()
        configureNavBar()
    }

    // MARK: Direct dynamic UIColors (DESIGN.md hex; light / dark)
    private static let ground = dyn(0xFBF6EE, 0x1C1713)
    private static let card = dyn(0xFFFFFF, 0x2A231D)
    private static let border = dyn(0xE7DACB, 0x3A312A)
    private static let text = dyn(0x2B2B2B, 0xF4EDE4)
    private static let muted = dyn(0x8A8378, 0xA89C8E)
    private static let action = rgb(0xFF5A1F) // constant in both modes

    private static func rgb(_ hex: UInt32) -> UIColor {
        UIColor(red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
    }
    private static func dyn(_ light: UInt32, _ dark: UInt32) -> UIColor {
        UIColor { $0.userInterfaceStyle == .dark ? rgb(dark) : rgb(light) }
    }

    private static func configureTabBar() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = card
        appearance.shadowColor = border

        let item = UITabBarItemAppearance()
        let label = UIFont.systemFont(ofSize: 11, weight: .semibold)
        item.selected.iconColor = action
        item.selected.titleTextAttributes = [.foregroundColor: action, .font: label]
        item.normal.iconColor = muted
        item.normal.titleTextAttributes = [.foregroundColor: muted, .font: label]
        appearance.stackedLayoutAppearance = item
        appearance.inlineLayoutAppearance = item
        appearance.compactInlineLayoutAppearance = item

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

    private static func configureNavBar() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = ground
        appearance.shadowColor = .clear
        // Onest, bundled variable font (wght axis set explicitly): inline 17/600,
        // large 34/700, in `text`.
        appearance.titleTextAttributes = [
            .foregroundColor: text, .font: VariableFont.fixed("Onest", size: 17, weight: 600),
        ]
        appearance.largeTitleTextAttributes = [
            .foregroundColor: text, .font: VariableFont.fixed("Onest", size: 34, weight: 700),
        ]

        let bar = UINavigationBar.appearance()
        bar.standardAppearance = appearance
        bar.scrollEdgeAppearance = appearance
        bar.compactAppearance = appearance
    }
}
