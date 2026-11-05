import SwiftUI

/// Balance history filters as a kit `FilterSheet`: account, type and date range.
/// Close re-runs the query; reset clears everything.
struct BalanceFiltersSheet: View {
    @Bindable var model: BalanceModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("common.clear", default: "Clear"),
            closeLabel: i18n.t("common.close"),
            onReset: { reset() },
            onClose: { Task { await model.reload() }; dismiss() }
        ) {
            AppFormField(label: i18n.t("balance.filterAccount")) {
                AppSelect(placeholder: i18n.t("balance.allAccounts"), selection: $model.accountCode,
                          options: [(String?.none, i18n.t("balance.allAccounts"))] +
                                    model.accounts.map { (String?.some($0.accountCode),
                                                          BalanceFormat.account($0.accountCode, label: $0.label, i18n)) })
            }
            AppFormField(label: i18n.t("balance.filterType")) {
                AppSelect(placeholder: i18n.t("balance.allTypes"), selection: $model.typeCode,
                          options: [(String?.none, i18n.t("balance.allTypes"))] +
                                    BalanceFormat.allTypeCodes.map { (String?.some($0),
                                                                      BalanceFormat.type($0, label: nil, i18n)) })
            }
            AppFormField(label: i18n.t("reports.period")) { KitDateRangeField(range: $model.range) }
        }
    }

    private func reset() {
        model.accountCode = nil
        model.typeCode = nil
        model.range = .all
        Task { await model.reload() }
        dismiss()
    }
}
