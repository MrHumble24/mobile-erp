import SwiftUI

/// Bottom sheet presenting consignment operational metrics and filtering controls.
/// Completely declutters the main consignments list screen while providing
/// instant visibility into debt totals, overdue units, and status filters.
struct ConsignmentsFilterSheet: View {
    @Bindable var model: ConsignmentsListModel
    var onApply: () -> Void

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Summary Metrics (Hero Outstanding, Overdue alert, counts)
                    ConsignmentsSummary(model: model)

                    // Filter Options
                    VStack(alignment: .leading, spacing: 12) {
                        Text(i18n.t("common.filter", default: "Filters"))
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)

                        // Status Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("consignments.filterStatus", default: "Consignment Status"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("consignments.filterStatus"), selection: $model.status) {
                                ForEach(ConsignmentStatusFilter.allCases) { s in
                                    Text(i18n.t(s.labelKey)).tag(s)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        // Period Preset Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("reports.period", default: "Period"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("reports.period"), selection: $model.preset) {
                                ForEach(RangePreset.allCases) { p in
                                    Text(p.labelKey.map { i18n.t($0) } ?? i18n.t("common.all")).tag(p)
                                }
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.secondarySystemBackground),
                                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
                        }

                        if model.preset == .custom {
                            VStack(spacing: 10) {
                                SheetDateField(label: i18n.t("reports.dateFrom", default: "From"),
                                               dateString: $model.customFrom)
                                SheetDateField(label: i18n.t("reports.dateTo", default: "To"),
                                               dateString: $model.customTo)
                            }
                        }

                        if hasActiveFilters {
                            Button(role: .destructive) {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                model.status = .all
                                model.preset = .all
                                model.customFrom = ""
                                model.customTo = ""
                                onApply()
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
            .navigationTitle(i18n.t("consignments.overviewTitle", default: "Overview & Filters"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.done", default: "Done")) {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        onApply()
                        dismiss()
                    }
                    .font(.headline)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var hasActiveFilters: Bool {
        model.status != .all || model.preset != .all || !model.customFrom.isEmpty || !model.customTo.isEmpty
    }
}

/// Helper date picker field inside the filter sheet.
private struct SheetDateField: View {
    let label: String
    @Binding var dateString: String

    @State private var date: Date = Date()

    var body: some View {
        DatePicker(label, selection: $date, displayedComponents: .date)
            .onChange(of: date) { _, newDate in
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                dateString = formatter.string(from: newDate)
            }
            .onAppear {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                if let parsed = formatter.date(from: dateString) {
                    date = parsed
                }
            }
    }
}

