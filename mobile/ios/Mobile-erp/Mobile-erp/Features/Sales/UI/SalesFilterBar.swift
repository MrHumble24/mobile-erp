import SwiftUI

/// Channel / status / warranty / cashier filters + a `KitDateRangeField` for the
/// sales list. Search is driven by the view's `.searchable`. Writes to the
/// model's `filters` and reloads on change. Stock controls so iOS chrome gets
/// Liquid Glass for free.
struct SalesFilterBar: View {
    let model: SalesListModel
    @Environment(I18n.self) private var i18n
    @State private var range = KitDateRange.all

    var body: some View {
        Section {
            Picker(i18n.t("sales.filterChannel"), selection: channel) {
                Text(i18n.t("common.all")).tag(String?.none)
                Text(i18n.t("sales.channelRetail")).tag(String?.some("retail"))
                Text(i18n.t("sales.channelB2B")).tag(String?.some("b2b"))
            }
            Picker(i18n.t("sales.filterStatus"), selection: returned) {
                Text(i18n.t("common.all")).tag(String?.none)
                Text(i18n.t("sales.statusActive")).tag(String?.some("false"))
                Text(i18n.t("sales.statusReturned")).tag(String?.some("true"))
            }
            Picker(i18n.t("sales.filterWarranty"), selection: warranty) {
                Text(i18n.t("common.all")).tag(String?.none)
                Text(i18n.t("sales.warrantyValid")).tag(String?.some("active"))
                Text(i18n.t("sales.warrantyExpired")).tag(String?.some("expired"))
            }
            if model.canReadUsers && !model.cashiers.isEmpty {
                Picker(i18n.t("sales.soldBy"), selection: soldBy) {
                    Text(i18n.t("common.all")).tag(String?.none)
                    ForEach(model.cashiers) { c in
                        Text(c.name).tag(String?.some(c.id))
                    }
                }
            }
            HStack {
                KitDateRangeField(range: $range)
                    .onChange(of: range) { _, r in
                        model.filters.from = r.from
                        model.filters.to = r.to
                        model.reload()
                    }
                Spacer()
                Button(i18n.t("sales.resetFilters"), systemImage: "arrow.counterclockwise") {
                    model.filters = SaleFilters()
                    range = .all
                    model.reload()
                }
                .font(.subheadline)
                .buttonStyle(.bordered)
            }
        }
    }

    private var channel: Binding<String?> {
        Binding(get: { model.filters.channel }, set: { model.filters.channel = $0; model.reload() })
    }
    private var returned: Binding<String?> {
        Binding(get: { model.filters.returned }, set: { model.filters.returned = $0; model.reload() })
    }
    private var warranty: Binding<String?> {
        Binding(get: { model.filters.warranty }, set: { model.filters.warranty = $0; model.reload() })
    }
    private var soldBy: Binding<String?> {
        Binding(get: { model.filters.soldById }, set: { model.filters.soldById = $0; model.reload() })
    }
}
