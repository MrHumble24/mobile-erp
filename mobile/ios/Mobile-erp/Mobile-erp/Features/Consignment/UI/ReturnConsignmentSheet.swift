import SwiftUI

/// Return an OUT consignment to stock (`consignment.settle`) — the partner gave
/// the device back. Condition decides whether it re-enters as IN_STOCK or
/// DEFECTIVE. Offline-capable via the writer's outbox fallback.
struct ReturnConsignmentSheet: View {
    let consignment: Consignment
    var onDone: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var condition = "IN_STOCK"
    @State private var reason = ""
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
                            Text(MoneyText.format(consignment.agreedPrice))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section(i18n.t("consignments.returnCondition", default: "Restock Condition")) {
                    Picker(i18n.t("consignments.returnCondition", default: "Condition"), selection: $condition) {
                        Text(i18n.t("consignments.conditionInStock", default: "In Stock")).tag("IN_STOCK")
                        Text(i18n.t("consignments.conditionDefective", default: "Defective")).tag("DEFECTIVE")
                    }
                    .pickerStyle(.segmented)
                    .padding(.vertical, 2)
                }

                Section(i18n.t("consignments.returnReason", default: "Return Reason")) {
                    TextField(i18n.t("consignments.returnReasonPlaceholder", default: "Reason for return (optional)"),
                              text: $reason, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section {
                    Label(i18n.t("consignments.returnHint", default: "This unit will be removed from the partner's liability and returned to inventory."),
                          systemImage: "arrow.uturn.backward.circle")
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
                        Task { await returnToStock() }
                    } label: {
                        if saving {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Label(i18n.t("consignments.return", default: "Confirm Return to Stock"), systemImage: "arrow.uturn.backward")
                                .font(.headline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 24)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.ink)
                    .disabled(saving)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            }
            .navigationTitle(i18n.t("consignments.return", default: "Return Consignment"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
                }
            }
        }
    }

    private func returnToStock() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = reason.trimmingCharacters(in: .whitespaces)
        do {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            _ = try await container.consignmentWriter.returnToStock(
                consignmentId: consignment.id, imei: consignment.imei,
                reason: t.isEmpty ? nil : t, condition: condition)
            onDone()
            dismiss()
        } catch {
            let e = error as? AppError
            errorMessage = e?.statusCode == 409 ? i18n.t("common.retry") : (e?.message ?? i18n.t("common.error"))
        }
    }
}
