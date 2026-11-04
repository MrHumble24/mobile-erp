import SwiftUI

/// Expense list filters as a kit `FilterSheet`: category, recurring, sort,
/// amount bounds and the date range. Search lives in the screen's search bar.
/// Close re-runs the query; reset clears everything.
struct ExpenseFiltersSheet: View {
    @Bindable var model: ExpensesModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("expenses.resetFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { reset() },
            onClose: { Task { await model.reload() }; dismiss() }
        ) {
            AppFormField(label: i18n.t("expenses.category")) {
                AppSelect(placeholder: i18n.t("common.all"), selection: $model.categoryId,
                          options: [(String?.none, i18n.t("common.all"))] + model.categories.map { (String?.some($0.id), $0.name) })
            }
            AppFormField(label: i18n.t("expenses.filterRecurring")) {
                AppSelect(placeholder: i18n.t("common.all"), selection: $model.isRecurring, options: [
                    (Bool?.none, i18n.t("common.all")),
                    (Bool?.some(true), i18n.t("expenses.recurringOnly")),
                    (Bool?.some(false), i18n.t("expenses.oneOff")),
                ])
            }
            AppFormField(label: i18n.t("expenses.sortLabel")) {
                AppSelect(placeholder: "", selection: $model.sort, options: ExpenseSort.allCases.map { ($0, i18n.t($0.labelKey)) })
            }
            HStack(spacing: Tokens.Space.md) {
                AppFormField(label: i18n.t("expenses.minAmount")) {
                    AppTextField(placeholder: "0", text: $model.minAmount, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($model.minAmount)
                }
                AppFormField(label: i18n.t("expenses.maxAmount")) {
                    AppTextField(placeholder: "0", text: $model.maxAmount, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($model.maxAmount)
                }
            }
            AppFormField(label: i18n.t("reports.period")) { KitDateRangeField(range: $model.range) }
        }
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
