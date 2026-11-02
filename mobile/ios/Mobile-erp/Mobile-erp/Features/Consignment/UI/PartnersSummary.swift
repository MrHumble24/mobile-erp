import SwiftUI

/// Four summary tiles derived from the filtered partner list: partner count,
/// devices out, outstanding total, overdue count (highlighted when non-zero).
struct PartnersSummary: View {
    let model: PartnersListModel
    @Environment(I18n.self) private var i18n

    private let columns = [GridItem(.adaptive(minimum: 150), spacing: 12)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ConsignmentMetricTile(label: i18n.t("partners.statsPartners"),
                       value: "\(model.filtered.count)")
            ConsignmentMetricTile(label: i18n.t("partners.statsDevicesOut"),
                       value: "\(model.devicesOut)")
            ConsignmentMetricTile(label: i18n.t("partners.statsOutstanding"),
                       value: MoneyText.format(model.outstanding))
            ConsignmentMetricTile(label: i18n.t("partners.statsOverdue"),
                       value: "\(model.overdue)", highlight: model.overdue > 0)
        }
    }
}
