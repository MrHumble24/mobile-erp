import SwiftUI

/// Bottom sheet presenting inventory stock metrics and filter options.
/// Houses device model, storage, and status filters, keeping the main
/// inventory search screen fast, clean, and distraction-free.
struct DeviceFilterSheet: View {
    @Binding var filter: DeviceFilter
    let metrics: DeviceMetrics
    let lowStockCount: Int
    let models: [DeviceModelView]
    let onShowAlerts: () -> Void

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    private let storages = ["64GB", "128GB", "256GB", "512GB", "1TB"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Stock Status & Quick Select Cards
                    VStack(alignment: .leading, spacing: 10) {
                        Text(i18n.t("inventory.stockStatus", default: "Stock by Status"))
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)

                        VStack(spacing: 8) {
                            statusTile(
                                label: i18n.t("inventory.metricsAll", default: "All Inventory"),
                                count: metrics.total,
                                color: Tokens.ink,
                                isSelected: filter.statusCode == nil
                            ) {
                                filter.statusCode = nil
                            }

                            statusTile(
                                label: i18n.t("inventory.metricsInStock", default: "In Stock (Available)"),
                                count: metrics.inStock,
                                color: Tokens.success,
                                isSelected: filter.statusCode == "IN_STOCK"
                            ) {
                                toggleStatus("IN_STOCK")
                            }

                            statusTile(
                                label: i18n.t("inventory.metricsConsigned", default: "Consigned to Partners"),
                                count: metrics.consigned,
                                color: Tokens.signalBlue,
                                isSelected: filter.statusCode == "CONSIGNED"
                            ) {
                                toggleStatus("CONSIGNED")
                            }

                            statusTile(
                                label: i18n.t("inventory.metricsDefective", default: "Defective / Needs Repair"),
                                count: metrics.defective,
                                color: Tokens.danger,
                                isSelected: filter.statusCode == "DEFECTIVE"
                            ) {
                                toggleStatus("DEFECTIVE")
                            }
                        }

                        if lowStockCount > 0 {
                            Button {
                                dismiss()
                                onShowAlerts()
                            } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundStyle(Tokens.warning)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("\(lowStockCount) \(i18n.t("inventory.metricsLowStock", default: "Low Stock Models"))")
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(Tokens.ink)
                                        Text(i18n.t("inventory.viewAlertRules", default: "Tap to review threshold rules"))
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.tertiary)
                                }
                                .padding(12)
                                .background(Tokens.warning.opacity(0.12),
                                            in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 4)
                        }
                    }
                    .padding(16)
                    .background(Color(.secondarySystemGroupedBackground),
                                in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))

                    // Model & Storage Filters
                    VStack(alignment: .leading, spacing: 14) {
                        Text(i18n.t("common.filter", default: "Filter Specifications"))
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)

                        // Model Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("inventory.filterModel", default: "Device Model"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("inventory.filterModel"), selection: $filter.modelId) {
                                Text(i18n.t("inventory.allModels", default: "All Models")).tag(String?.none)
                                ForEach(models) { Text($0.label).tag(String?.some($0.id)) }
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.secondarySystemBackground),
                                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
                        }

                        // Storage Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("inventory.filterStorage", default: "Storage Capacity"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("inventory.filterStorage"), selection: $filter.storage) {
                                Text(i18n.t("inventory.allStorages", default: "All Capacities")).tag(String?.none)
                                ForEach(storages, id: \.self) { Text($0).tag(String?.some($0)) }
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.secondarySystemBackground),
                                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
                        }

                        if !filter.isEmpty {
                            Button(role: .destructive) {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                filter = DeviceFilter()
                                dismiss()
                            } label: {
                                Label(i18n.t("inventory.clearFilters", default: "Reset All Filters"),
                                      systemImage: "arrow.counterclockwise")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                            }
                            .buttonStyle(.bordered)
                            .tint(Tokens.danger)
                            .padding(.top, 4)
                        }
                    }
                    .padding(16)
                    .background(Color(.secondarySystemGroupedBackground),
                                in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(i18n.t("inventory.filtersTitle", default: "Overview & Filters"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.done", default: "Done")) {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        dismiss()
                    }
                    .font(.headline)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func toggleStatus(_ code: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        filter.statusCode = (filter.statusCode == code) ? nil : code
    }

    private func statusTile(label: String, count: Int, color: Color, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Circle().fill(color).frame(width: 10, height: 10)
                Text(label)
                    .font(.subheadline.weight(isSelected ? .semibold : .regular))
                    .foregroundStyle(Tokens.ink)
                Spacer()
                Text("\(count)")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Tokens.ink)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(Tokens.ink)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(isSelected ? Color(.systemBackground) : Color(.secondarySystemBackground),
                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous)
                    .strokeBorder(isSelected ? Tokens.ink : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }
}

