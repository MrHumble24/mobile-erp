import SwiftUI

/// Roomy, single-column summary for the partner directory.
/// Strictly avoids multi-column grids so debt and partner metrics
/// are immediately clear and accessible.
struct PartnersSummary: View {
    let model: PartnersListModel
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(spacing: 12) {
            // 1. Hero Card: Total Outstanding Partner Balances
            AppCard(padding: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Label(i18n.t("partners.statsOutstanding", default: "Total Partner Receivables"),
                              systemImage: "creditcard")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                        Spacer()
                    }

                    MoneyText(value: model.outstanding, size: 28)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(Tokens.ink)

                    Text(i18n.t("partners.outstandingSubtitle", default: "Total unpaid balances owed across all bazaar partner shops."))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // 2. Overdue Alert Card (when overdue > 0)
            if model.overdue > 0 {
                AppCard(
                    padding: 14,
                    backgroundColor: Tokens.danger.opacity(0.10),
                    borderColor: Tokens.danger.opacity(0.35)
                ) {
                    HStack(spacing: 14) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Tokens.danger)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(model.overdue) \(i18n.t("partners.statsOverdue", default: "Overdue Partner Balances"))")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(Tokens.danger)

                            Text(i18n.t("partners.overdueDesc", default: "Partner stores with payments or consignments past due date."))
                                .font(.caption)
                                .foregroundStyle(Tokens.danger.opacity(0.85))
                        }
                        Spacer()
                    }
                }
            }

            // 3. Operational Overview Card
            AppCard(padding: 16) {
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("partners.statsPartners", default: "Partner Shops Registered"))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Tokens.ink)
                            Text(i18n.t("partners.partnersSubtitle", default: "Active trading partners in Malika Bazaar"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(model.filtered.count)")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Tokens.ink)
                    }

                    Divider()

                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("partners.statsDevicesOut", default: "Total Devices Consigned"))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Tokens.ink)
                            Text(i18n.t("partners.devicesOutSubtitle", default: "Units currently with partners"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(model.devicesOut)")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Tokens.signalBlue)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}
