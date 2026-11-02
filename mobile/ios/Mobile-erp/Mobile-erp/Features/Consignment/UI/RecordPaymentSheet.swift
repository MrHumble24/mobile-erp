import SwiftUI

/// Record a partner payment — online-only (`partner.payment`). Blocks offline.
struct RecordPaymentSheet: View {
    let partner: Partner
    var onSaved: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var amount = ""
    @State private var notes = ""
    @State private var saving = false
    @State private var errorMessage: String?

    private var online: Bool { container.connectivity.isOnline }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("\(partner.shopName) · \(i18n.t("partners.outstanding")): \(MoneyText.format(partner.outstanding))")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                if !online {
                    Label(i18n.t("common.offline", default: "You're offline. Connect to save."),
                          systemImage: "wifi.slash").foregroundStyle(Tokens.warning)
                }
                Section {
                    LabeledField(i18n.t("partners.paymentAmount"), text: $amount, mono: true, number: true)
                    LabeledField(i18n.t("common.notes"), text: $notes)
                }
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("partners.recordPayment"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("partners.recordPayment")) { Task { await save() } }
                        .disabled(saving || !online || (Double(amount) ?? 0) <= 0)
                }
            }
        }
    }

    private func save() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = notes.trimmingCharacters(in: .whitespaces)
        do {
            try await container.partnerRepository.recordPayment(partner.id, RecordPaymentDto(
                amount: Double(amount) ?? 0, consignmentId: nil, paidAt: nil,
                notes: t.isEmpty ? nil : t))
            container.sync.syncNow()
            onSaved()
            dismiss()
        } catch {
            errorMessage = (error as? AppError)?.message ?? i18n.t("common.error")
        }
    }
}
