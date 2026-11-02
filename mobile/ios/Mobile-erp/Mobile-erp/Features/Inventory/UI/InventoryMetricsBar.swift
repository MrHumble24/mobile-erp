import SwiftUI

/// Metrics strip above the devices list. The status cards toggle the list
/// filter; the low-stock card jumps to the Alerts tab. Counts come from the
/// full cached list (status) and the online low-stock feed.
struct InventoryMetricsBar: View {
    let metrics: DeviceMetrics
    let lowStockCount: Int
    let selectedStatus: String?
    let onSelectStatus: (String?) -> Void
    let onShowAlerts: () -> Void

    @Environment(I18n.self) private var i18n

    private let columns = [GridItem(.adaptive(minimum: 104), spacing: 8)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 8) {
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
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private func toggle(_ code: String) {
        onSelectStatus(selectedStatus == code ? nil : code)
    }

    private func card(_ labelKey: String, _ value: Int, _ color: Color,
                      active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(i18n.t(labelKey))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                    Spacer()
                    Circle().fill(color).frame(width: 9, height: 9)
                }
                Text("\(value)")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(Tokens.ink)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(Color(.secondarySystemGroupedBackground),
                        in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous)
                    .strokeBorder(active ? Tokens.ink : Tokens.hairline, lineWidth: active ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
