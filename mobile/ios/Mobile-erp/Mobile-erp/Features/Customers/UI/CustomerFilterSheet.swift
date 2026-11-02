import SwiftUI

/// Bottom sheet presenting customer directory sort and filter options.
/// Keeps the customer directory search list uncluttered and focused.
struct CustomerFilterSheet: View {
    @Bindable var model: CustomersModel

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if let stats = model.stats {
                    Section(i18n.t("sales.statsOverview", default: "Customer Overview")) {
                        CustomersSummary(stats: stats)
                            .listRowInsets(EdgeInsets(top: 8, leading: 4, bottom: 8, trailing: 4))
                            .listRowBackground(Color.clear)
                    }
                }

                Section(i18n.t("common.sort", default: "Sort Order")) {
                    Picker(i18n.t("common.sort", default: "Sort"), selection: $model.sort) {
                        Label(i18n.t("common.date", default: "Recently Active"), systemImage: "clock").tag("recent")
                        Label(i18n.t("common.name", default: "Alphabetical (Name)"), systemImage: "textformat").tag("name")
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section(i18n.t("common.filter", default: "Purchase Activity")) {
                    Toggle(isOn: $model.hasPurchasesOnly) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("sales.customerSalesHistory", default: "Has Purchase History"))
                                .font(.body)
                                .foregroundStyle(Tokens.ink)
                            Text(i18n.t("sales.customerSalesHistoryDesc", default: "Show only customers who have completed at least one device purchase."))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if hasActiveFilters {
                    Section {
                        Button(role: .destructive) {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            model.sort = "recent"
                            model.hasPurchasesOnly = false
                            model.reload()
                            dismiss()
                        } label: {
                            Label(i18n.t("inventory.clearFilters", default: "Reset All Filters"),
                                  systemImage: "arrow.counterclockwise")
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("common.filter", default: "Filter & Sort"))
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
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var hasActiveFilters: Bool {
        model.sort != "recent" || model.hasPurchasesOnly
    }
}

