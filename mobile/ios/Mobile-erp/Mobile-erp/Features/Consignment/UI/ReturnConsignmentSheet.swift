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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("consignments.return")) { dismiss() }
                SubjectBlock(title: consignment.partnerShopName.isEmpty ? "—" : consignment.partnerShopName, line: consignment.imei)
                AppFormField(label: i18n.t("consignments.returnCondition")) {
                    SegmentedControl(selection: $condition, segments: [
                        ("IN_STOCK", i18n.t("consignments.conditionInStock")),
                        ("DEFECTIVE", i18n.t("consignments.conditionDefective")),
                    ])
                }
                AppFormField(label: i18n.t("consignments.returnReason")) {
                    AppTextField(placeholder: i18n.t("consignments.returnReason"), text: $reason)
                }
                if let errorMessage { FormErrorLine(message: errorMessage) }
                Button { Task { await returnToStock() } } label: {
                    Text(i18n.t("consignments.return")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillDestructive)
                .disabled(saving)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    private func returnToStock() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = reason.trimmingCharacters(in: .whitespaces)
        do {
            Haptic.tick.play()
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
