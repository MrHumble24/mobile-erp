import SwiftUI

/// Horizontal scrolling pill tab bar for the report tabs — the mobile stand-in
/// for the web `TabsList`. The selected pill fills with ink; the rest are mist.
struct FinTabBar: View {
    let tabs: [FinReportTab]
    @Binding var selection: FinReportTab
    @Environment(I18n.self) private var i18n

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(tabs) { tab in
                    Button {
                        if selection != tab {
                            Haptic.tick.play()
                            selection = tab
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: tab.systemImage)
                                .font(.caption2.weight(.semibold))
                            Text(i18n.t(tab.labelKey))
                                .font(.subheadline.weight(selection == tab ? .semibold : .regular))
                        }
                        .foregroundStyle(selection == tab ? Tokens.onInk : Tokens.ink)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            selection == tab ? Tokens.ink : Tokens.surface,
                            in: Capsule()
                        )
                        .overlay(
                            Capsule().strokeBorder(selection == tab ? Color.clear : Tokens.hairline, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }
}
