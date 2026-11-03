import SwiftUI

/// Dedicated screen for Consignment (Nasiya) financial metrics and operational statistics.
/// Completely decoupled from filtering to ensure zero clutter and focused insights.
struct ConsignmentsStatsView: View {
    @Bindable var model: ConsignmentsListModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let s = model.stats {
                        // 1. Hero Card: Outstanding Partner Debt
                        AppCard(padding: 18) {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Label(i18n.t("consignments.statsOutstanding", default: "Qarzdorlik"),
                                          systemImage: "banknote.fill")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(Tokens.warning)
                                    Spacer()
                                }

                                MoneyText(value: s.outstanding, size: 32)
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundStyle(Tokens.ink)

                                Text(i18n.t("consignments.outstandingDesc",
                                            default: "Hamkor do'konlardan qaytarilishi kerak bo'lgan jami qarz balansi."))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // 2. Overdue Warning Card (when non-zero)
                        if s.overdueCount > 0 {
                            AppCard(
                                padding: 16,
                                backgroundColor: Tokens.danger.opacity(0.08),
                                borderColor: Tokens.danger.opacity(0.3)
                            ) {
                                HStack(spacing: 14) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .font(.title2)
                                        .foregroundStyle(Tokens.danger)

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("\(s.overdueCount) ta \(i18n.t("consignments.statsOverdue", default: "Muddati o'tgan"))")
                                            .font(.headline.weight(.bold))
                                            .foregroundStyle(Tokens.danger)

                                        Text(i18n.t("consignments.overdueDesc",
                                                    default: "Ushbu qurilmalarning to'lov yoki qaytarish muddati tugagan."))
                                            .font(.caption)
                                            .foregroundStyle(Tokens.danger.opacity(0.9))
                                    }
                                    Spacer()
                                }
                            }
                        }

                        // 3. Operational Distribution Card
                        AppCard(padding: 18) {
                            VStack(alignment: .leading, spacing: 14) {
                                Text(i18n.t("consignments.distributionTitle", default: "Qurilmalar taqsimoti"))
                                    .font(.headline.weight(.semibold))
                                    .foregroundStyle(Tokens.ink)

                                VStack(spacing: 12) {
                                    metricRow(
                                        title: i18n.t("consignments.statsOpen", default: "Nasiyadagilar (Ochiq)"),
                                        subtitle: i18n.t("consignments.openSubtitle", default: "Hamkorlar qo'lidagi faol qurilmalar"),
                                        value: "\(s.openCount)",
                                        color: Tokens.signalBlue,
                                        icon: "shippingbox.fill"
                                    )

                                    Divider()

                                    metricRow(
                                        title: i18n.t("consignments.statsOverdue", default: "Muddati o'tganlar"),
                                        subtitle: i18n.t("consignments.overdueSubtitle", default: "Muddatidan kechikkan nasiyalar"),
                                        value: "\(s.overdueCount)",
                                        color: s.overdueCount > 0 ? Tokens.danger : Tokens.slate,
                                        icon: "calendar.badge.exclamationmark"
                                    )

                                    Divider()

                                    metricRow(
                                        title: i18n.t("consignments.statsTotal", default: "Jami qayd etilgan"),
                                        subtitle: i18n.t("consignments.totalSubtitle", default: "Barcha vaqtlardagi nasiyalar"),
                                        value: "\(s.total)",
                                        color: Tokens.ink,
                                        icon: "tray.full.fill"
                                    )
                                }
                            }
                        }
                    } else {
                        LoadingView()
                            .frame(height: 200)
                    }
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(i18n.t("consignments.statsTitle", default: "Nasiya tahlili"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close", default: "Yopish")) {
                        dismiss()
                    }
                    .font(.headline)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func metricRow(title: String, subtitle: String, value: String, color: Color, icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.body.weight(.medium))
                .foregroundStyle(color)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Tokens.ink)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(color)
        }
    }
}
