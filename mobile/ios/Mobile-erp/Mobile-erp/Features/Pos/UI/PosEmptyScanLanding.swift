import SwiftUI

/// Inviting empty state when no device has been scanned yet.
struct PosEmptyScanLanding: View {
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: Tokens.Space.md) {
            ZStack {
                Circle()
                    .fill(Tokens.surface2)
                    .frame(width: 64, height: 64)
                Image(systemName: "barcode.viewfinder")
                    .font(.system(size: 30))
                    .foregroundStyle(Tokens.muted)
            }

            VStack(spacing: Tokens.Space.xs) {
                Text(i18n.t("pos.cartEmpty", default: "Ready to Scan"))
                    .font(.ui(.heading))
                    .foregroundStyle(Tokens.text)
                Text(i18n.t("pos.scanPrompt", default: "Scan a device IMEI or use the camera to start checkout."))
                    .font(.ui(.body))
                    .foregroundStyle(Tokens.muted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
    }
}
