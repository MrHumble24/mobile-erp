import SwiftUI

/// Partner directory filters as a kit `FilterSheet`: active segmented control
/// and the overdue-only switch.
struct PartnersFilterSheet: View {
    @Bindable var model: PartnersListModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("inventory.clearFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { model.active = .all; model.overdueOnly = false; dismiss() },
            onClose: { dismiss() }
        ) {
            SegmentedControl(selection: $model.active, segments: [
                (.all, i18n.t("common.all")),
                (.active, i18n.t("partners.active")),
                (.inactive, i18n.t("partners.inactive")),
            ])
            Toggle(isOn: $model.overdueOnly) {
                Text(i18n.t("partners.overdueOnly")).font(.ui(.body)).foregroundStyle(Tokens.text)
            }
            .frame(minHeight: Tokens.Space.minTouch)
        }
    }
}
