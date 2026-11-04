import SwiftUI

/// Period filter for the consignments list as a kit `FilterSheet` (status
/// lives in the chip row on the screen). Custom dates are the model's
/// `yyyy-MM-dd` strings behind two kit date fields.
struct ConsignmentsFilterSheet: View {
    @Bindable var model: ConsignmentsListModel
    var onApply: () -> Void
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("inventory.clearFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { model.preset = .all; model.customFrom = ""; model.customTo = ""; onApply(); dismiss() },
            onClose: { onApply(); dismiss() }
        ) {
            AppFormField(label: i18n.t("reports.period")) {
                AppSelect(placeholder: i18n.t("common.all"), selection: $model.preset,
                          options: RangePreset.allCases.map { ($0, $0.labelKey.map { i18n.t($0) } ?? i18n.t("common.all")) })
            }
            if model.preset == .custom {
                AppFormField(label: i18n.t("reports.dateFrom")) { AppDateField(date: dateBinding($model.customFrom)) }
                AppFormField(label: i18n.t("reports.dateTo")) { AppDateField(date: dateBinding($model.customTo)) }
            }
        }
    }

    private func dateBinding(_ text: Binding<String>) -> Binding<Date> {
        Binding(
            get: { Self.formatter.date(from: text.wrappedValue) ?? Date() },
            set: { text.wrappedValue = Self.formatter.string(from: $0) }
        )
    }

    private static let formatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}
