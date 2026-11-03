import SwiftUI

/// Expense list filters: search, category, recurring, date range (kit field),
/// amount bounds and sort. Edits bind straight to the screen model; Apply
/// re-runs the query, Reset clears everything.
struct ExpenseFiltersSheet: View {
    @Bindable var model: ExpensesModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if let summary = model.summary {
                    Section(i18n.t("common.summary", default: "Summary")) {
                        ExpensesSummaryCard(summary: summary)
                            .listRowInsets(EdgeInsets(top: 8, leading: 4, bottom: 8, trailing: 4))
                            .listRowBackground(Color.clear)
                    }
                }

                Section {
                    TextField(i18n.t("common.search"), text: $model.search)
                }
                Section {
                    Picker(i18n.t("expenses.category"), selection: $model.categoryId) {
                        Text(i18n.t("common.all")).tag(String?.none)
                        ForEach(model.categories) { c in Text(c.name).tag(String?.some(c.id)) }
                    }
                    Picker(i18n.t("expenses.isRecurring"), selection: $model.isRecurring) {
                        Text(i18n.t("common.all")).tag(Bool?.none)
                        Text(i18n.t("expenses.recurringOnly")).tag(Bool?.some(true))
                        Text(i18n.t("expenses.oneOff")).tag(Bool?.some(false))
                    }
                }
                Section(i18n.t("reports.period")) {
                    KitDateRangeField(range: $model.range)
                }
                Section {
                    TextField(i18n.t("expenses.minAmount"), text: $model.minAmount)
                        .keyboardType(.decimalPad)
                        .sanitizeDecimal($model.minAmount)
                    TextField(i18n.t("expenses.maxAmount"), text: $model.maxAmount)
                        .keyboardType(.decimalPad)
                        .sanitizeDecimal($model.maxAmount)
                }
                Section {
                    Picker(i18n.t("expenses.sortLabel"), selection: $model.sort) {
                        ForEach(ExpenseSort.allCases) { s in Text(i18n.t(s.labelKey)).tag(s) }
                    }
                }
            }
            .navigationTitle(i18n.t("common.filter"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("expenses.resetFilters")) { reset() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.confirm")) {
                        Task { await model.reload() }
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func reset() {
        model.search = ""
        model.categoryId = nil
        model.isRecurring = nil
        model.minAmount = ""
        model.maxAmount = ""
        model.range = .all
        model.sort = .newest
        Task { await model.reload() }
        dismiss()
    }
}
