import SwiftUI

/// Channel + status + date-range + search filters for the sales list. Writes to
/// the model's `filters` and reloads on change. Stock controls so iOS chrome
/// gets Liquid Glass for free.
struct SalesFilterBar: View {
    let model: SalesListModel
    @Environment(I18n.self) private var i18n

    @State private var useRange = false

    var body: some View {
        @Bindable var model = model
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
            Toggle(i18n.t("common.date"), isOn: $useRange.animation())
                .onChange(of: useRange) { _, on in
                    if !on { model.filters.from = nil; model.filters.to = nil; model.reload() }
                    else { setDefaultRange() }
                }
            if useRange {
                DatePicker(i18n.t("sales.soldAt"), selection: from, displayedComponents: .date)
                DatePicker(i18n.t("sales.statusReturned"), selection: to, displayedComponents: .date)
            }
        }
    }

    private var channel: Binding<String?> {
        Binding(get: { model.filters.channel }, set: { model.filters.channel = $0; model.reload() })
    }
    private var returned: Binding<String?> {
        Binding(get: { model.filters.returned }, set: { model.filters.returned = $0; model.reload() })
    }
    private var from: Binding<Date> {
        Binding(get: { model.filters.from ?? Date() }, set: { model.filters.from = $0; model.reload() })
    }
    private var to: Binding<Date> {
        Binding(get: { model.filters.to ?? Date() }, set: { model.filters.to = $0; model.reload() })
    }

    private func setDefaultRange() {
        let now = Date()
        model.filters.from = Calendar.current.date(byAdding: .day, value: -30, to: now)
        model.filters.to = now
        model.reload()
    }
}
