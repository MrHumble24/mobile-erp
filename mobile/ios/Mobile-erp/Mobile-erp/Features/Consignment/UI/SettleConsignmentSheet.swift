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
                Section { Text("IMEI: \(consignment.imei)").font(.mono(13)).foregroundStyle(.secondary) }
                Section {
                    CaptionedField(i18n.t("consignments.settlePrice"), text: $salePrice, mono: true, number: true)
                    CaptionedField(i18n.t("common.notes"), text: $notes)
                }
                Text(i18n.t("consignments.settleHint")).font(.footnote).foregroundStyle(.secondary)
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            .navigationTitle(i18n.t("consignments.settle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(i18n.t("common.cancel")) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("consignments.settle")) { Task { await settle() } }
                        .disabled(saving || (Double(salePrice) ?? 0) <= 0)
                }
            }
            .onAppear { if salePrice.isEmpty { salePrice = agreedWhole } }
        }
    }

    private var agreedWhole: String { String(Int(Double(consignment.agreedPrice) ?? 0)) }

    private func settle() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = notes.trimmingCharacters(in: .whitespaces)
        do {
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
