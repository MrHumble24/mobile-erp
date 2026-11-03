import SwiftUI

/// Dedicated bottom sheet for Partner directory statistics and receivables overview.
struct PartnersStatsView: View {
    let model: PartnersListModel
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    PartnersSummary(model: model)
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(i18n.t("partners.statsTitle", default: "Hamkorlar statistikasi"))
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
}
