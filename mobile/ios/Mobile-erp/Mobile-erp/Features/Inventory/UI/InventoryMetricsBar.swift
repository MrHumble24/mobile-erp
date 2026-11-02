import SwiftUI

/// Roomy, horizontal scrolling metrics strip above the devices list.
/// Strictly avoids multi-column grids so labels are uncompressed and
/// filter cards are effortless to tap with one thumb.
struct InventoryMetricsBar: View {
    let metrics: DeviceMetrics
    let lowStockCount: Int
    let selectedStatus: String?
    let onSelectStatus: (String?) -> Void
    let onShowAlerts: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                card("inventory.metricsTotal", metrics.total, Tokens.ink,
                     active: selectedStatus == nil) { onSelectStatus(nil) }
                card("inventory.metricsInStock", metrics.inStock, Tokens.success,
                     active: selectedStatus == "IN_STOCK") { toggle("IN_STOCK") }
                card("inventory.metricsDefective", metrics.defective, Tokens.danger,
                     active: selectedStatus == "DEFECTIVE") { toggle("DEFECTIVE") }
                card("inventory.metricsConsigned", metrics.consigned, Tokens.signalBlue,
                     active: selectedStatus == "CONSIGNED") { toggle("CONSIGNED") }
                card("inventory.metricsLowStock", lowStockCount, Tokens.warning,
                     active: false, action: onShowAlerts)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    private func toggle(_ code: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        onSelectStatus(selectedStatus == code ? nil : code)
    }

    private func card(_ labelKey: String, _ value: Int, _ color: Color,
                      active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Circle().fill(color).frame(width: 8, height: 8)
                    Text(i18n.t(labelKey))
                        .font(.caption.weight(active ? .semibold : .regular))
                        .foregroundStyle(active ? Tokens.ink : .secondary)
                        .lineLimit(1)
                    Spacer()
                }
                Text("\(value)")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(Tokens.ink)
            }
            .frame(width: 125, alignment: .leading)
            .padding(12)
            .background(Color(.secondarySystemGroupedBackground),
                        in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .strokeBorder(active ? Tokens.ink : Tokens.hairline, lineWidth: active ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
