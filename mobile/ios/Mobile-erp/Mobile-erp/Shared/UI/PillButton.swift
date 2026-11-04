import SwiftUI

/// The Warm Card button (DESIGN.md): a 52 pt pill, radius 14, Onest body-strong
/// label. `primary` is the one orange on a screen; everything else is quiet.
/// Press = scale 0.98 + a darker fill over 120 ms, no bounce. Disabled loses the
/// orange entirely (surface-2 fill, muted label).
///
///   Button("Sotuvni yakunlash") { … }.buttonStyle(.pillPrimary)
///
/// Width is the caller's: add `.frame(maxWidth: .infinity)` for a full-width action.
struct PillButton: ButtonStyle {
    enum Kind { case primary, secondary, ghost, destructive }
    let kind: Kind

    func makeBody(configuration: Configuration) -> some View {
        PillButtonBody(kind: kind, configuration: configuration)
    }
}

private struct PillButtonBody: View {
    let kind: PillButton.Kind
    let configuration: ButtonStyle.Configuration
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        configuration.label
            .font(.ui(.bodyStrong))
            .foregroundStyle(foreground)
            .frame(minHeight: Tokens.Space.controlH)
            .padding(.horizontal, kind == .ghost ? Tokens.Space.md : Tokens.Space.gutter)
            .background(
                RoundedRectangle(cornerRadius: Tokens.Radius.buttons, style: .continuous)
                    .fill(background(configuration.isPressed))
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
            .contentShape(RoundedRectangle(cornerRadius: Tokens.Radius.buttons, style: .continuous))
    }

    private var foreground: Color {
        guard isEnabled else { return Tokens.muted }
        switch kind {
        case .primary: return Tokens.onAction
        // Dark lifts `danger` to a pink text hue, so a white label would fail AA;
        // the dark destructive pill is the status pair instead (dangerBg + danger).
        case .destructive: return colorScheme == .dark ? Tokens.danger : Tokens.onAction
        case .secondary, .ghost: return Tokens.text
        }
    }

    private func background(_ pressed: Bool) -> Color {
        guard isEnabled else { return kind == .ghost ? .clear : Tokens.surface2 }
        switch kind {
        case .primary: return pressed ? Tokens.actionPressed : Tokens.action
        // No `dangerPressed` token; the 0.98 scale carries the press feedback.
        case .destructive: return colorScheme == .dark ? Tokens.dangerBg : Tokens.danger
        case .secondary: return pressed ? Tokens.border : Tokens.surface2
        case .ghost: return pressed ? Tokens.surface2 : .clear
        }
    }
}

extension ButtonStyle where Self == PillButton {
    static var pillPrimary: PillButton { PillButton(kind: .primary) }
    static var pillSecondary: PillButton { PillButton(kind: .secondary) }
    static var pillGhost: PillButton { PillButton(kind: .ghost) }
    static var pillDestructive: PillButton { PillButton(kind: .destructive) }
}
