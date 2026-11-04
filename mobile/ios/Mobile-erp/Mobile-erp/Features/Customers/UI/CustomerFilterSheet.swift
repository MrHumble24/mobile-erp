import SwiftUI

/// Customer directory sort + has-purchases filter as a kit `FilterSheet`.
/// Search stays in the system search bar on the screen.
struct CustomerFilterSheet: View {
    @Bindable var model: CustomersModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("customers.resetFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { model.sort = "recent"; model.hasPurchasesOnly = false; model.reload(); dismiss() },
            onClose: { model.reload(); dismiss() }
        ) {
            AppFormField(label: i18n.t("customers.sortLabel")) {
                SegmentedControl(selection: $model.sort, segments: [
                    ("recent", i18n.t("customers.sortRecent")),
                    ("name", i18n.t("customers.sortName")),
                ])
            }
            Toggle(isOn: $model.hasPurchasesOnly) {
                Text(i18n.t("customers.hasPurchasesYes")).font(.ui(.body)).foregroundStyle(Tokens.text)
            }
            .frame(minHeight: Tokens.Space.minTouch)
        }
    }
}
