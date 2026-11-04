import SwiftUI

/// Status filter chips above the devices list — one row of pills, each a status
/// with its count in mono. Tapping a status toggles the list filter; the
/// selected chip wears the status pill pair (hue on tint), the rest sit as
/// white cards. The low-stock chip jumps to the Alerts tab. Same anatomy as the
/// Android `InventoryMetricsBar`.
struct InventoryMetricsBar: View {
    let metrics: DeviceMetrics
    let lowStockCount: Int
    let selectedStatus: String?
    let onSelectStatus: (String?) -> Void
    let onShowAlerts: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Tokens.Space.sm) {
                chip("inventory.metricsTotal", metrics.total, Tokens.text,
                     selected: selectedStatus == nil) { onSelectStatus(nil) }
                chip("inventory.metricsInStock", metrics.inStock, Tokens.success,
                     selected: selectedStatus == "IN_STOCK") { toggle("IN_STOCK") }
                chip("inventory.metricsDefective", metrics.defective, Tokens.danger,
                     selected: selectedStatus == "DEFECTIVE") { toggle("DEFECTIVE") }
                chip("inventory.metricsConsigned", metrics.consigned, Tokens.info,
                     selected: selectedStatus == "CONSIGNED") { toggle("CONSIGNED") }
                chip("inventory.metricsLowStock", lowStockCount, Tokens.warning,
                     selected: false, action: onShowAlerts)
            }
            .padding(.horizontal, Tokens.Space.gutter)
        }
    }

    private func toggle(_ code: String) {
        onSelectStatus(selectedStatus == code ? nil : code)
    }

    private func chip(_ labelKey: String, _ value: Int, _ hue: Color,
                      selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Tokens.Space.sm) {
                Text(i18n.t(labelKey))
                    .font(.ui(.label))
                    .foregroundStyle(selected ? hue : Tokens.muted)
                Text("\(value)")
                    .font(.mono(12, weight: .semibold))
                    .foregroundStyle(selected ? hue : Tokens.text)
            }
            .lineLimit(1)
            .padding(.horizontal, Tokens.Space.lg)
            .frame(height: Tokens.Space.minTouch)
            .background(selected ? Tokens.pillTint(hue) : Tokens.card, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}
