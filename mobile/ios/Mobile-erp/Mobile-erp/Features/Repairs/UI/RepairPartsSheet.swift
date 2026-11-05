import SwiftUI

/// Add a part to a ticket (ADR 0040): a quantity product + pieces, taken out of
/// stock (`REPAIR_USE`). The existing parts are removable in the ticket detail.
struct RepairPartsSheet: View {
    let repairId: String
    let onDone: (RepairView) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var products: [PurchaseModel] = []
    @State private var modelId: String?
    @State private var quantity = 1
    @State private var busy = false
    @State private var error: String?

    private var canAdd: Bool { modelId != nil && quantity > 0 && !busy && container.connectivity.isOnline }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("repairs.addPart", default: "Add a part")) { dismiss() }
                AppCard {
                    VStack(alignment: .leading, spacing: Tokens.Space.md) {
                        AppFormField(label: i18n.t("repairs.part", default: "Part")) {
                            AppSelect(placeholder: i18n.t("repairs.selectPart", default: "Select a product"),
                                      selection: Binding(get: { modelId ?? "" }, set: { modelId = $0.isEmpty ? nil : $0 }),
                                      options: products.map { ($0.id, $0.label) })
                        }
                        AppFormField(label: i18n.t("repairs.quantity", default: "Quantity")) {
                            Stepper(value: $quantity, in: 1...9999) {
                                Text("\(quantity)").font(.data(.regular)).foregroundStyle(Tokens.text)
                            }
                        }
                    }
                }
                if products.isEmpty {
                    Text(i18n.t("repairs.noParts", default: "No quantity products in the catalog yet."))
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                if let error { FormErrorLine(message: error) }
                Button(action: add) {
                    if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("common.add", default: "Add")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(!canAdd)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
        .task { if products.isEmpty { products = (try? await RepairsRepository(container).partProducts()) ?? [] } }
    }

    private func add() {
        guard canAdd, let modelId else { return }
        busy = true; error = nil
        Haptic.tick.play()
        Task {
            do {
                let updated = try await RepairsRepository(container).addPart(repairId, AddPartPayload(modelId: modelId, quantity: quantity))
                busy = false
                onDone(updated)
                dismiss()
            } catch let e as AppError { busy = false; error = RepairError.message(e, i18n) }
            catch { busy = false; self.error = error.localizedDescription }
        }
    }
}
