import SwiftUI

/// Switch with the `action` on-track (DESIGN.md: a toggle is a control, so the
/// one orange is earned here). Applied once at the app root; labels and
/// `labelsHidden` pass through unchanged.
struct AppSwitchStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Toggle(configuration)
            .toggleStyle(.switch)
            .tint(Tokens.action)
    }
}
