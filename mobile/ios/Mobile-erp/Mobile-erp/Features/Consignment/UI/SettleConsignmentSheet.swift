import SwiftUI

/// Settle an OUT consignment (`consignment.settle`) — the partner sold it.
/// Offline-capable via the writer's outbox fallback; the sale price defaults to
/// the agreed price.
struct SettleConsignmentSheet: View {
    let consignment: Consignment
    var onDone: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var salePrice = ""
    @State private var notes = ""
    @State private var saving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(consignment.partnerShopName)
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(Tokens.ink)

                        HStack {
                            Text("IMEI: \(consignment.imei)")
                                .font(.mono(12))
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(i18n.t("consignments.agreedPrice", default: "Agreed: \(MoneyText.format(consignment.agreedPrice))"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section(i18n.t("consignments.settlePrice", default: "Settlement Price")) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("$")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(.secondary)
                        TextField("0", text: $salePrice)
                            .font(.mono(22, weight: .bold))
                            .keyboardType(.decimalPad)
                            .monospacedDigit()
                        if salePrice != agreedWhole {
                            Spacer()
                            Button {
                                salePrice = agreedWhole
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            } label: {
                                Text(i18n.t("common.reset", default: "Agreed: $\(agreedWhole)"))
                                    .font(.caption2.weight(.medium))
                                    .foregroundStyle(Tokens.signalBlue)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Tokens.signalBlue.opacity(0.12), in: Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 2)
                }

                Section {
                    CaptionedField(i18n.t("common.notes", default: "Notes"), text: $notes)
                }

                Section {
                    Label(i18n.t("consignments.settleHint", default: "Settling marks this device as sold and credits the partner's account."),
                          systemImage: "info.circle")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
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
                        Task { await settle() }
                    } label: {
                        if saving {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Label(i18n.t("consignments.settle", default: "Confirm Settlement"), systemImage: "checkmark.circle.fill")
                                .font(.headline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 24)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.success)
                    .disabled(saving || (Double(salePrice) ?? 0) <= 0)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            }
            .navigationTitle(i18n.t("consignments.settle", default: "Settle Consignment"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
            }
            .onAppear {
                if salePrice.isEmpty { salePrice = agreedWhole }
            }
        }
    }

    private var agreedWhole: String { String(Int(Double(consignment.agreedPrice) ?? 0)) }

    private func settle() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = notes.trimmingCharacters(in: .whitespaces)
        do {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            _ = try await container.consignmentWriter.settle(
                consignmentId: consignment.id, imei: consignment.imei,
                salePrice: Double(salePrice), notes: t.isEmpty ? nil : t)
            onDone()
            dismiss()
        } catch {
            let e = error as? AppError
            errorMessage = e?.statusCode == 409 ? i18n.t("common.retry") : (e?.message ?? i18n.t("common.error"))
        }
    }
}
