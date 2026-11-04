import SwiftUI

/// Device list filter sheet (kit `FilterSheet`): model + storage. Status is the
/// inline chip row and IMEI search is the search bar, so neither lives here.
/// Every control applies immediately; reset clears model + storage.
struct DeviceFilterSheet: View {
    @Binding var filter: DeviceFilter
    let models: [DeviceModelView]

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    private let storages = ["64GB", "128GB", "256GB", "512GB", "1TB"]

    var body: some View {
        FilterSheet(
            title: i18n.t("common.filter"),
            resetLabel: i18n.t("inventory.clearFilters"),
            closeLabel: i18n.t("common.close"),
            onReset: { filter.modelId = nil; filter.storage = nil },
            onClose: { dismiss() }
        ) {
            AppFormField(label: i18n.t("inventory.filterModel")) {
                AppSelect(
                    placeholder: i18n.t("inventory.allModels"),
                    selection: $filter.modelId,
                    options: [(String?.none, i18n.t("inventory.allModels"))]
                        + models.map { (String?.some($0.id), $0.label) }
                )
            }
            AppFormField(label: i18n.t("inventory.filterStorage")) {
                AppSelect(
                    placeholder: i18n.t("inventory.allStorages"),
                    selection: $filter.storage,
                    options: [(String?.none, i18n.t("inventory.allStorages"))]
                        + storages.map { (String?.some($0), $0) }
                )
            }
        }
    }
}
