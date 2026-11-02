import SwiftUI

/// Bottom sheet for sales list filtering (channel, status, date range).
/// Completely removes filter clutter from the main sales screen.
struct SalesFilterSheet: View {
    @Bindable var model: SalesListModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var useRange = false

    var body: some View {
        NavigationStack {
            Form {
                Section(i18n.t("sales.filterChannel", default: "Sales Channel")) {
                    Picker(i18n.t("sales.filterChannel", default: "Channel"), selection: channelBinding) {
                        Text(i18n.t("common.all", default: "All Channels")).tag(String?.none)
                        Text(i18n.t("sales.channelRetail", default: "Retail (B2C)")).tag(String?.some("retail"))
                        Text(i18n.t("sales.channelB2B", default: "Partner Consignment (B2B)")).tag(String?.some("b2b"))
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section(i18n.t("sales.filterStatus", default: "Sale Status")) {
                    Picker(i18n.t("sales.filterStatus", default: "Status"), selection: statusBinding) {
                        Text(i18n.t("common.all", default: "All Statuses")).tag(String?.none)
                        Text(i18n.t("sales.statusActive", default: "Completed")).tag(String?.some("false"))
                        Text(i18n.t("sales.statusReturned", default: "Returned")).tag(String?.some("true"))
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section(i18n.t("common.date", default: "Date Filter")) {
                    Toggle(i18n.t("sales.filterByDate", default: "Filter by Date Range"), isOn: $useRange.animation())
                        .onChange(of: useRange) { _, on in
                            if !on {
                                model.filters.from = nil
                                model.filters.to = nil
                            } else if model.filters.from == nil {
                                let now = Date()
                                model.filters.from = Calendar.current.date(byAdding: .day, value: -30, to: now)
                                model.filters.to = now
                            }
                        }

                    if useRange {
                        DatePicker(i18n.t("reports.dateFrom", default: "From"), selection: fromBinding, displayedComponents: .date)
                        DatePicker(i18n.t("reports.dateTo", default: "To"), selection: toBinding, displayedComponents: .date)
                    }
                }

                if hasFilters {
                    Section {
                        Button(role: .destructive) {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            model.filters.channel = nil
                            model.filters.returned = nil
                            model.filters.from = nil
                            model.filters.to = nil
                            useRange = false
                            model.reload()
                            dismiss()
                        } label: {
                            Label(i18n.t("inventory.clearFilters", default: "Reset All Filters"), systemImage: "arrow.counterclockwise")
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("common.filter", default: "Filter Sales"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.apply", default: "Apply")) {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        model.reload()
                        dismiss()
                    }
                    .font(.headline)
                }
            }
            .onAppear {
                useRange = model.filters.from != nil || model.filters.to != nil
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var hasFilters: Bool {
        model.filters.channel != nil || model.filters.returned != nil || model.filters.from != nil || model.filters.to != nil
    }

    private var channelBinding: Binding<String?> {
        Binding(get: { model.filters.channel }, set: { model.filters.channel = $0 })
    }

    private var statusBinding: Binding<String?> {
        Binding(get: { model.filters.returned }, set: { model.filters.returned = $0 })
    }

    private var fromBinding: Binding<Date> {
        Binding(get: { model.filters.from ?? Date() }, set: { model.filters.from = $0 })
    }

    private var toBinding: Binding<Date> {
        Binding(get: { model.filters.to ?? Date() }, set: { model.filters.to = $0 })
    }
}

