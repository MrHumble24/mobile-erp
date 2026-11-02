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
                Section { Text("IMEI: \(consignment.imei)").font(.mono(13)).foregroundStyle(.secondary) }
                Section {
                    Picker(i18n.t("consignments.returnCondition"), selection: $condition) {
                        Text(i18n.t("consignments.conditionInStock")).tag("IN_STOCK")
                        Text(i18n.t("consignments.conditionDefective")).tag("DEFECTIVE")
                    }
                    LabeledField(i18n.t("consignments.returnReason"), text: $reason)
                }
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("consignments.return"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(i18n.t("common.cancel")) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("consignments.return")) { Task { await returnToStock() } }
                        .disabled(saving)
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
