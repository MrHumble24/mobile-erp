import SwiftUI

/// Pill badge tinted by a semantic status color (Ink `*-bg` fill, solid label) —
/// the Caldera status-chip look. Pass a color directly, or use
/// `StatusBadge(deviceStatus:label:)` for the device-status palette.
struct StatusBadge: View {
    let label: String
    let color: Color

    init(_ label: String, color: Color) {
        self.label = label
        self.color = color
    }

    /// Device status code (`IN_STOCK` / `DEFECTIVE` / `CONSIGNED` / `SOLD`).
    init(deviceStatus code: String, label: String) {
        self.label = label
        self.color = Tokens.deviceStatusColor(code)
    }

    var body: some View {
        Text(label)
            .font(.ui(.label))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Tokens.pillTint(color), in: Capsule())
    }
}
