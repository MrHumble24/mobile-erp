import SwiftUI

/// Add a phone the customer gives in part payment (Change 14, ADR 0039): pick an
/// IMEI/serial model, scan or type its identifier, and set the trade-in value.
/// The value lowers what the customer pays; the phone enters stock at that value
/// when the sale posts. Online only — the caller gates the entry point.
struct PosTradeInSheet: View {
    /// Hands the built trade-in back to the cart.
    let onAdd: (PosTradeIn) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var models: [PurchaseModel] = []
    @State private var modelId: String?
    @State private var imei = ""
    @State private var serial = ""
    @State private var value = ""

    private var model: PurchaseModel? { models.first { $0.id == modelId } }

    private var valueDecimal: Decimal { Decimal(string: value.trimmingCharacters(in: .whitespaces)) ?? .zero }

    private var identifierValid: Bool {
        guard let model else { return false }
        if model.isSerial { return UnitCode.isValidSerial(UnitCode.normalizeSerial(serial)) }
        return BuyPhoneDraft.isImei(imei)
    }
    private var canAdd: Bool { model != nil && identifierValid && valueDecimal > 0 }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("purchases.tradeInAdd", default: "Add a trade-in")) { dismiss() }
                Text(i18n.t("purchases.tradeInHint", default: "Take a phone in part payment"))
                    .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                AppCard {
                    AppFormField(label: i18n.t("purchases.unit", default: "Phone")) {
                        AppSelect(placeholder: i18n.t("shipments.selectModel", default: "Select a model"),
                                  selection: Binding(get: { modelId ?? "" },
                                                     set: { modelId = $0.isEmpty ? nil : $0; imei = ""; serial = "" }),
                                  options: models.map { ($0.id, $0.label) })
                    }
                }
                if let model { identifier(model) }
                AppCard {
                    AppFormField(label: i18n.t("purchases.tradeInValue", default: "Trade-in value")) {
                        AppTextField(placeholder: "0", text: $value, keyboard: .decimalPad, font: .mono(15, weight: .medium))
                            .sanitizeDecimal($value)
                    }
                }
                Button {
                    guard canAdd, let model else { return }
                    onAdd(build(model))
                    dismiss()
                } label: {
                    Text(i18n.t("common.add", default: "Add")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(!canAdd)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            if models.isEmpty { models = (try? await PurchasesRepository(container).sellableModels()) ?? [] }
            #if DEBUG
            if modelId == nil, let id = KitDebugLaunch.consume("tradeInModel", accept: { arg in models.contains { $0.id == arg } }) {
                modelId = id
            }
            #endif
        }
    }

    @ViewBuilder private func identifier(_ model: PurchaseModel) -> some View {
        AppCard {
            if model.isSerial {
                AppFormField(label: i18n.t("catalog.serialNumber", default: "Serial number")) {
                    ScanOrValueField(text: $serial, placeholder: i18n.t("catalog.scanCode", default: "Scan or type"))
                }
            } else {
                AppFormField(label: i18n.t("inventory.imei1", default: "IMEI")) {
                    ScanOrValueField(text: $imei, placeholder: i18n.t("shipments.scanImei", default: "Scan or type the IMEI"))
                }
            }
        }
    }

    private func build(_ model: PurchaseModel) -> PosTradeIn {
        PosTradeIn(
            id: newUUID(),
            modelId: model.id,
            modelLabel: model.label,
            imei: model.isSerial ? nil : imei.trimmingCharacters(in: .whitespaces),
            imei2: nil,
            serialNumber: model.isSerial ? UnitCode.normalizeSerial(serial) : nil,
            specs: [:],
            value: valueDecimal)
    }
}
