import SwiftUI

/// User directory filters as a kit `FilterSheet`: status segmented control and
/// the role select. Search stays in the screen's search bar.
struct UsersFilterSheet: View {
    @Bindable var model: UsersListModel
    let catalog: UsersCatalog
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("users.resetFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { model.roleFilter = ""; model.activeFilter = ""; model.onFilterChange(); dismiss() },
            onClose: { dismiss() }
        ) {
            AppFormField(label: i18n.t("users.filterStatus")) {
                SegmentedControl(selection: $model.activeFilter, segments: [
                    ("", i18n.t("common.all")),
                    ("active", i18n.t("users.statusActive")),
                    ("inactive", i18n.t("users.statusInactive")),
                ])
                .onChange(of: model.activeFilter) { model.onFilterChange() }
            }
            AppFormField(label: i18n.t("users.filterRole")) {
                AppSelect(placeholder: i18n.t("common.all"), selection: $model.roleFilter,
                          options: [("", i18n.t("common.all"))] + catalog.roles.map { ($0.code, $0.name) })
                    .onChange(of: model.roleFilter) { model.onFilterChange() }
            }
        }
    }
}
