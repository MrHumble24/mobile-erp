import SwiftUI

/// Process-return form. Returns are ONLINE-ONLY (not one of the four offline
/// mutation types), so submit is blocked with a needs-connection message when
/// offline.
struct ReturnSheet: View {
    let saleId: String
    let onDone: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var refund = ""
    @State private var reason = ""
    @State private var condition = "IN_STOCK"
    @State private var busy = false
    @State private var error: String?

    private var refundValid: Bool { SalesInput.money(refund) >= 0 && !refund.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section(i18n.t("sales.refundAmount")) {
                    TextField(i18n.t("sales.refundAmount"), text: $refund)
                        .keyboardType(.decimalPad)
                        .font(.mono(16))
                }
                Section(i18n.t("sales.returnReason")) {
                    TextField(i18n.t("sales.returnReasonPlaceholder"), text: $reason, axis: .vertical)
                        .lineLimit(1...3)
                }
                Section(i18n.t("sales.returnCondition")) {
                    Picker(i18n.t("sales.returnCondition"), selection: $condition) {
                        Text(i18n.t("sales.returnToStock")).tag("IN_STOCK")
                        Text(i18n.t("sales.returnToDefective")).tag("DEFECTIVE")
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }
                if let error {
                    Section { Text(error).foregroundStyle(Tokens.destructive).font(.footnote) }
                }
            }
            .navigationTitle(i18n.t("sales.returnDevice"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if busy { ProgressView() }
                    else {
                        Button(i18n.t("sales.returnDevice"), action: submit)
                            .disabled(!refundValid)
                    }
                }
            }
        }
    }

    private func submit() {
        guard refundValid, !busy else { return }
        guard container.connectivity.isOnline else {
            error = i18n.t("common.offline", default: "You are offline. This needs a connection.")
            return
        }
        busy = true
        error = nil
        let repo = SalesRepository(api: container.api, context: container.modelContext)
        Task {
            do {
                try await repo.processReturn(
                    id: saleId,
                    refundAmount: SalesInput.money(refund),
                    toStatusCode: condition,
                    reason: SalesInput.orNil(reason),
                    expectedVersion: nil
                )
                busy = false
                onDone()
                dismiss()
            } catch let e as AppError {
                busy = false
                error = e.statusCode == 409 ? i18n.t("sales.returnConflict") : e.message
            } catch {
                busy = false
                self.error = error.localizedDescription
            }
        }
    }
}
