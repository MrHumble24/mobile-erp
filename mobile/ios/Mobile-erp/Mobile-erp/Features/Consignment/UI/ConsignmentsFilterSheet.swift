import SwiftUI

/// Dedicated bottom sheet for filtering the Consignments (Nasiyalar) list.
/// Free of stats clutter, providing clean, accessible controls that never squash labels.
struct ConsignmentsFilterSheet: View {
    @Bindable var model: ConsignmentsListModel
    var onApply: () -> Void

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                // Section 1: Consignment Status
                Section(i18n.t("consignments.filterStatus", default: "Holati")) {
                    Picker(i18n.t("consignments.filterStatus"), selection: $model.status) {
                        ForEach(ConsignmentStatusFilter.allCases) { s in
                            HStack {
                                Text(i18n.t(s.labelKey))
                                Spacer()
                            }
                            .tag(s)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                // Section 2: Date Period
                Section(i18n.t("reports.period", default: "Vaqt oralig'i")) {
                    Picker(i18n.t("reports.period"), selection: $model.preset) {
                        ForEach(RangePreset.allCases) { p in
                            Text(p.labelKey.map { i18n.t($0) } ?? i18n.t("common.all")).tag(p)
                        }
                    }

                    if model.preset == .custom {
                        SheetDateField(label: i18n.t("reports.dateFrom", default: "Boshlanish"),
                                       dateString: $model.customFrom)
                        SheetDateField(label: i18n.t("reports.dateTo", default: "Tugash"),
                                       dateString: $model.customTo)
                    }
                }

                // Section 3: Reset
                if hasActiveFilters {
                    Section {
                        Button(role: .destructive) {
                            Haptic.tick.play()
                            model.reset()
                            onApply()
                            dismiss()
                        } label: {
                            Label(i18n.t("inventory.clearFilters", default: "Filtrlarni tozalash"),
                                  systemImage: "arrow.counterclockwise")
                                .foregroundStyle(Tokens.danger)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("common.filter", default: "Filtrlar"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Bekor qilish")) {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.apply", default: "Qo'llash")) {
                        Haptic.tick.play()
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
