import SwiftUI

/// Switch with a fixed green on-track. The app tint is ink, which turns near-white
/// in Dark Mode and leaves the white knob invisible, so toggles must not inherit it.
/// Applied once at the app root; labels and `labelsHidden` pass through unchanged.
struct AppSwitchStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Toggle(configuration)
            .toggleStyle(.switch)
            .tint(Tokens.success)
    }
}
