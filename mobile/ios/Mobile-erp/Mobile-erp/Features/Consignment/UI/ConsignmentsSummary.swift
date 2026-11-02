import SwiftUI

/// Four summary tiles from `/consignments/stats`: total, open, outstanding,
/// overdue (highlighted when non-zero).
struct ConsignmentsSummary: View {
    let model: ConsignmentsListModel
    @Environment(I18n.self) private var i18n

    private let columns = [GridItem(.adaptive(minimum: 150), spacing: 12)]

    var body: some View {
        if let s = model.stats {
            LazyVGrid(columns: columns, spacing: 12) {
                ConsignmentMetricTile(label: i18n.t("consignments.statsTotal"), value: "\(s.total)")
                ConsignmentMetricTile(label: i18n.t("consignments.statsOpen"), value: "\(s.openCount)")
                ConsignmentMetricTile(label: i18n.t("consignments.statsOutstanding"),
                           value: MoneyText.format(s.outstanding))
                ConsignmentMetricTile(label: i18n.t("consignments.statsOverdue"),
                           value: "\(s.overdueCount)", highlight: s.overdueCount > 0)
            }
        }
    }
}
