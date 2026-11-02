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
                    VStack(alignment: .leading, spacing: 6) {
                        Text(partner.shopName)
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(Tokens.ink)

                        HStack(alignment: .firstTextBaseline) {
                            Text(i18n.t("partners.outstanding", default: "Outstanding Debt:"))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Spacer()
                            MoneyText(value: partner.outstanding, size: 18)
                                .font(.headline.weight(.bold))
                                .foregroundStyle(Tokens.warning)
                        }

                        if let outstandingVal = Double(partner.outstanding), outstandingVal > 0, amount != String(Int(outstandingVal)) {
                            Button {
                                amount = String(Int(outstandingVal))
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            } label: {
                                Text(i18n.t("partners.payFull", default: "Fill Full Balance ($\(Int(outstandingVal)))"))
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(Tokens.signalBlue)
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 2)
                        }
                    }
                    .padding(.vertical, 4)
                }

                if !online {
                    Section {
                        Label(i18n.t("common.offline", default: "You are offline. Connect to internet to record payments."),
                              systemImage: "wifi.slash")
                            .font(.footnote)
                            .foregroundStyle(Tokens.warning)
                    }
                }

                Section(i18n.t("partners.paymentAmount", default: "Payment Amount")) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("$")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(.secondary)
                        TextField("0", text: $amount)
                            .font(.mono(22, weight: .bold))
                            .keyboardType(.decimalPad)
                            .monospacedDigit()
                    }
                    .padding(.vertical, 2)
                }

                Section {
                    CaptionedField(i18n.t("common.notes", default: "Notes (payment method / reference)"), text: $notes)
                }

                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "exclamationmark.triangle")
                            .font(.footnote)
                            .foregroundStyle(Tokens.danger)
                    }
                }

                Section {
                    Button {
                        Task { await save() }
                    } label: {
                        if saving {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Label(i18n.t("partners.recordPayment", default: "Confirm Payment"), systemImage: "checkmark.circle.fill")
                                .font(.headline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 24)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.success)
                    .disabled(saving || !online || (Double(amount) ?? 0) <= 0)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            }
            .navigationTitle(i18n.t("partners.recordPayment", default: "Record Payment"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
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
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
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
