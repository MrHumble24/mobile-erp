import SwiftUI

/// Inviting empty state when no device has been scanned yet.
struct PosEmptyScanLanding: View {
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(.tertiarySystemFill))
                    .frame(width: 64, height: 64)
                Image(systemName: "barcode.viewfinder")
                    .font(.system(size: 30))
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 4) {
                Text(i18n.t("pos.cartEmpty", default: "Ready to Scan"))
                    .font(.headline)
                    .foregroundStyle(Tokens.ink)
                Text(i18n.t("pos.scanPrompt", default: "Scan a device IMEI or use the camera to start checkout."))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
    }
}
