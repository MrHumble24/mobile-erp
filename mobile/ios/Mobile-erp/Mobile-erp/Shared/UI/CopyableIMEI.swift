import SwiftUI

/// A labelled mono IMEI line with a copy-to-clipboard button that flips to a
/// checkmark for 1.5s. Used for both the primary IMEI and the optional second
/// IMEI (dual-SIM) in the device detail sheet, so the copy logic lives once.
struct CopyableIMEI: View {
    let label: String
    let value: String
    var accessibilityLabel: String = ""

    @State private var copied = false

    var body: some View {
        HStack(spacing: 8) {
            Text("\(label): \(value)")
                .font(.mono(13, weight: .medium))
                .foregroundStyle(Tokens.ink)
            Button(action: copy) {
                Image(systemName: copied ? "checkmark" : "doc.on.doc")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(copied ? Tokens.success : .secondary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(accessibilityLabel)
        }
    }

    private func copy() {
        UIPasteboard.general.string = value
        Haptic.tick.play()
        withAnimation(.snappy(duration: 0.2)) { copied = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation { copied = false }
        }
    }
}
