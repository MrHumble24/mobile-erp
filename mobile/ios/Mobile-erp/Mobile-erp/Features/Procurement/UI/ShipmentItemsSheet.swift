import SwiftUI

/// Add quantity stock lines to a shipment (ADR 0030): pick a QUANTITY product,
/// its pieces and cost per piece, stage one or more lines (each with its line
/// total), and save them. Money leaves the shipment's "paid from" account, shown
/// read-only. Online-only. Calls back with the purchased lines.
struct ShipmentItemsSheet: View {
    let shipment: Shipment
    let onSaved: ([PurchasedLine], [ShipmentItemDTO]) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var models: [DeviceModel] = []
    @State private var modelId: String?
    @State private var quantity = ""
    @State private var unitCost = ""
    @State private var staged: [ShipmentItemDTO] = []
    @State private var busy = false
    @State private var error: String?

    private var quantityModels: [DeviceModel] { models.filter { $0.isQuantity } }

    /// The line currently being composed, when valid.
    private var composed: ShipmentItemDTO? {
        guard let modelId,
              let qty = Int(quantity.trimmingCharacters(in: .whitespaces)), qty > 0,
              let cost = Decimal(string: unitCost.trimmingCharacters(in: .whitespaces)), cost > 0,
              let model = quantityModels.first(where: { $0.id == modelId })
        else { return nil }
        return ShipmentItemDTO(modelId: modelId, quantity: qty, unitCost: cost, label: model.label)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                    if quantityModels.isEmpty {
                        Text(i18n.t("catalog.stockEmpty")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                    } else {
                        composeForm
                    }
                    if !staged.isEmpty { stagedList }
                    if let error { Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger) }
                }
                .padding(Tokens.Space.gutter)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(Tokens.card)
            .navigationTitle(i18n.t("catalog.addStock"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(i18n.t("common.cancel")) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save")) { save() }.disabled(staged.isEmpty || busy)
                }
            }
            .task { await loadModels() }
        }
    }

    private var composeForm: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.lg) {
            Text(i18n.t("catalog.addStockHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            AppFormField(label: i18n.t("inventory.model")) {
                AppSelect(placeholder: i18n.t("inventory.model"), selection: $modelId,
                          options: quantityModels.map { (String?.some($0.id), $0.label) })
            }
            HStack(alignment: .bottom, spacing: Tokens.Space.md) {
                AppFormField(label: i18n.t("catalog.quantity")) {
                    AppTextField(placeholder: "0", text: $quantity, keyboard: .numberPad,
                                 font: .mono(15, weight: .medium)).sanitizeDigits($quantity)
                }
                AppFormField(label: i18n.t("catalog.unitCost")) {
                    AppTextField(placeholder: "0", text: $unitCost, keyboard: .decimalPad,
                                 font: .mono(15, weight: .medium)).sanitizeDecimal($unitCost)
                }
            }
            if let line = composed {
                HStack {
                    Text(i18n.t("catalog.lineTotal")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    Spacer()
                    MoneyText(value: NSDecimalNumber(decimal: line.lineTotal).stringValue, size: 15)
                        .foregroundStyle(Tokens.text)
                }
            }
            if let code = shipment.paymentAccountCode {
                HStack {
                    Text(i18n.t("balance.payFrom")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    Spacer()
                    Text(PaymentAccounts.label(code, i18n)).font(.ui(.body)).foregroundStyle(Tokens.text)
                }
            }
            Button { addLine() } label: {
                Label(i18n.t("catalog.addStock"), systemImage: "plus").frame(maxWidth: .infinity)
            }
            .buttonStyle(.pillSecondary)
            .disabled(composed == nil)
        }
    }

    private var stagedList: some View {
        VStack(spacing: Tokens.Space.sm) {
            ForEach(staged) { line in
                AppCard {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(line.label).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                            Text("\(line.quantity) × \(MoneyText.format(NSDecimalNumber(decimal: line.unitCost).stringValue))")
                                .font(.data(.regular)).foregroundStyle(Tokens.muted)
                        }
                        Spacer()
                        MoneyText(value: NSDecimalNumber(decimal: line.lineTotal).stringValue, size: 15)
                            .foregroundStyle(Tokens.text)
                        Button(role: .destructive) { staged.removeAll { $0.id == line.id } } label: {
                            Image(systemName: "trash").foregroundStyle(Tokens.muted)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func addLine() {
        guard let line = composed else { return }
        staged.append(line)
        quantity = ""; unitCost = ""
        Haptic.tick.play()
    }

    private func loadModels() async {
        guard models.isEmpty else { return }
        models = (try? await DeviceModelsRepository(api: container.api).list()) ?? []
    }

    private func save() {
        guard !staged.isEmpty, !busy else { return }
        guard container.connectivity.isOnline else { error = i18n.t("common.offline", default: "Offline"); return }
        busy = true
        error = nil
        let items = staged
        Task {
            do {
                let lines = try await ShipmentsRepository(api: container.api).addItems(shipment.id, items)
                busy = false
                container.toasts.success(i18n.t("catalog.stockSaved"))
                onSaved(lines, items)
                dismiss()
            } catch let e as AppError {
                busy = false
                error = e.message
            } catch {
                busy = false
                self.error = i18n.t("common.error")
            }
        }
    }
}
