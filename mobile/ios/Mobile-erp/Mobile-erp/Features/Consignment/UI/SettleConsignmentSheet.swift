import SwiftUI

/// Settle an OUT consignment (`consignment.settle`) — the partner sold it. The
/// sale price defaults to the agreed price. Offline-capable via the writer's
/// outbox fallback.
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("consignments.settle")) { dismiss() }
                SubjectBlock(title: consignment.partnerShopName.isEmpty ? "—" : consignment.partnerShopName, line: consignment.unitCode) {
                    MoneyText(value: consignment.agreedPrice, size: 15).foregroundStyle(Tokens.muted)
                }
                AppFormField(label: i18n.t("consignments.settlePrice")) {
                    AppTextField(placeholder: "0", text: $salePrice, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($salePrice)
                }
                AppFormField(label: i18n.t("common.notes")) {
                    AppTextField(placeholder: i18n.t("common.notes"), text: $notes)
                }
                Text(i18n.t("consignments.settleHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                if let errorMessage { FormErrorLine(message: errorMessage) }
                Button { Task { await settle() } } label: {
                    Text(i18n.t("consignments.settle")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || (Double(salePrice) ?? 0) <= 0)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
        .onAppear { if salePrice.isEmpty { salePrice = agreedWhole } }
    }

    private var agreedWhole: String { String(Int(Double(consignment.agreedPrice) ?? 0)) }

    private func settle() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = notes.trimmingCharacters(in: .whitespaces)
        do {
            Haptic.tick.play()
            _ = try await container.consignmentWriter.settle(
                consignmentId: consignment.id, code: consignment.unitCode,
                salePrice: Double(salePrice), notes: t.isEmpty ? nil : t)
            onDone()
            dismiss()
        } catch {
            let e = error as? AppError
            errorMessage = e?.statusCode == 409 ? i18n.t("common.retry") : (e?.message ?? i18n.t("common.error"))
        }
    }
}
