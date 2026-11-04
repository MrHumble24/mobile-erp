import SwiftUI

/// Offline strip (DESIGN.md: offline states visible): a quiet `surface2` banner,
/// radius 12, with a muted icon and message. No orange — being offline is not an
/// action. Copy is the caller's.
struct OfflineBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            Image(systemName: "wifi.slash")
                .font(.ui(.caption))
                .foregroundStyle(Tokens.muted)
            Text(message)
                .font(.ui(.caption))
                .foregroundStyle(Tokens.muted)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, Tokens.Space.lg)
        .padding(.vertical, Tokens.Space.md)
        .background(
            RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous)
                .fill(Tokens.surface2)
        )
    }
}
