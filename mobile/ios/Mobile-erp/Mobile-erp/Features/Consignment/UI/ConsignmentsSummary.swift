import SwiftUI

/// Roomy, single-column summary for consignments.
/// Strictly avoids multi-column grids so metrics are immediately clear,
/// accessible, and uncompressed on all device sizes.
struct ConsignmentsSummary: View {
    let model: ConsignmentsListModel
    @Environment(I18n.self) private var i18n

    var body: some View {
        if let s = model.stats {
            VStack(spacing: 12) {
                // 1. Hero Card: Total Outstanding Receivables
                AppCard(padding: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Label(i18n.t("consignments.statsOutstanding", default: "Outstanding Partner Debt"),
                                  systemImage: "banknote")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.secondary)
                            Spacer()
                        }

                        MoneyText(value: s.outstanding, size: 28)
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(Tokens.ink)

                        Text(i18n.t("consignments.outstandingDesc", default: "Total unpaid balance currently due from partner shops."))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                // 2. Overdue Warning Card (when non-zero)
                if s.overdueCount > 0 {
                    AppCard(
                        padding: 14,
                        backgroundColor: Tokens.badBg,
                        borderColor: Tokens.danger.opacity(0.35)
                    ) {
                        HStack(spacing: 14) {
                            Image(systemName: "exclamationmark.circle.fill")
                                .font(.title2)
                                .foregroundStyle(Tokens.danger)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(s.overdueCount) \(i18n.t("consignments.statsOverdue", default: "Overdue Consignments"))")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(Tokens.danger)

                                Text(i18n.t("consignments.overdueDesc", default: "These devices passed their return or settlement due date."))
                                    .font(.caption)
                                    .foregroundStyle(Tokens.danger.opacity(0.85))
                            }
                            Spacer()
                        }
                    }
                }

                // 3. Status Overview Card: Open vs Total
                AppCard(padding: 16) {
                    VStack(spacing: 12) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(i18n.t("consignments.statsOpen", default: "Currently in Partner Shops"))
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Tokens.ink)
                                Text(i18n.t("consignments.openSubtitle", default: "Active consignment inventory"))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(s.openCount)")
                                .font(.title2.weight(.bold))
                                .foregroundStyle(Tokens.signalBlue)
                        }

                        Divider()

                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(i18n.t("consignments.statsTotal", default: "Total Consignments Recorded"))
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(s.total)")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }
}
