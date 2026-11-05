import SwiftUI

/// "Buy a phone" — record a used phone bought from a customer (Change 14, ADR
/// 0039). Seller (existing or new name+phone), an IMEI/serial product and its
/// identifier (camera scan as elsewhere), the model's attributes, the price paid
/// and cash/card. Online only. No passport or ID field anywhere.
struct BuyPhoneSheet: View {
    /// Called after a successful buy so the list can reload.
    let onBought: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var draft = BuyPhoneDraft()
    @State private var models: [PurchaseModel] = []
    @State private var accounts: [PaymentAccount] = []
    @State private var busy = false
    @State private var error: String?
    @State private var bought: CustomerPurchaseView?

    private var model: PurchaseModel? { models.first { $0.id == draft.modelId } }
    private var offline: Bool { !container.connectivity.isOnline }
    private var canBuy: Bool { !offline && draft.isValid(model) && !busy }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("purchases.buyTitle", default: "Buy a phone")) { dismiss() }
                if let bought {
                    result(bought)
                } else {
                    form
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            if models.isEmpty { models = (try? await PurchasesRepository(container).sellableModels()) ?? [] }
            if accounts.isEmpty { accounts = await PaymentAccounts.load(api: container.api, i18n: i18n) }
            #if DEBUG
            if draft.modelId == nil, let id = KitDebugLaunch.consume("buyModel", accept: { arg in models.contains { $0.id == arg } }) {
                draft.modelId = id
            }
            #endif
        }
    }

    @ViewBuilder private var form: some View {
        sellerSection
        productSection
        if let model { identifier(model); specsSection(model) }
        moneySection
        if offline { FormErrorLine(message: i18n.t("purchases.tradeInOffline", default: "Available online only")) }
        if let error { FormErrorLine(message: error) }
        Button(action: buy) {
            if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
            else { Text(i18n.t("purchases.buyTitle", default: "Buy a phone")).frame(maxWidth: .infinity) }
        }
        .buttonStyle(.pillPrimary)
        .disabled(!canBuy)
    }

    private var sellerSection: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("purchases.seller", default: "Seller")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                PurchaseSellerField(seller: $draft.seller)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var productSection: some View {
        AppCard {
            AppFormField(label: i18n.t("purchases.unit", default: "Phone")) {
                AppSelect(placeholder: i18n.t("shipments.selectModel", default: "Select a model"),
                          selection: Binding(get: { draft.modelId ?? "" },
                                             set: { draft.modelId = $0.isEmpty ? nil : $0; draft.specs = [:]; draft.imei = ""; draft.imei2 = ""; draft.serial = "" }),
                          options: models.map { ($0.id, $0.label) })
            }
        }
    }

    @ViewBuilder private func identifier(_ model: PurchaseModel) -> some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                if model.isSerial {
                    AppFormField(label: i18n.t("catalog.serialNumber", default: "Serial number")) {
                        ScanOrValueField(text: $draft.serial, placeholder: i18n.t("catalog.scanCode", default: "Scan or type"))
                    }
                } else {
                    AppFormField(label: i18n.t("inventory.imei1", default: "IMEI 1")) {
                        ScanOrValueField(text: $draft.imei, placeholder: i18n.t("shipments.scanImei", default: "Scan or type the IMEI"))
                    }
                    Toggle(i18n.t("inventory.dualSim", default: "Dual SIM"), isOn: $draft.dualSim.animation())
                        .font(.ui(.body)).foregroundStyle(Tokens.text)
                    if draft.dualSim {
                        AppFormField(label: i18n.t("inventory.imei2", default: "IMEI 2")) {
                            ScanOrValueField(text: $draft.imei2, placeholder: i18n.t("inventory.imei2", default: "IMEI 2"))
                        }
                    }
                }
            }
        }
    }

    private func specsSection(_ model: PurchaseModel) -> some View {
        Group {
            if model.attributes.isEmpty { EmptyView() } else {
                AppCard {
                    VStack(alignment: .leading, spacing: Tokens.Space.md) {
                        ForEach(model.attributes) { attr in
                            PurchaseSpecField(attr: attr, value: Binding(
                                get: { draft.specs[attr.key] ?? "" },
                                set: { draft.specs[attr.key] = $0 }))
                        }
                    }
                }
            }
        }
    }

    private var moneySection: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                AppFormField(label: i18n.t("purchases.pricePaid", default: "Price paid")) {
                    AppTextField(placeholder: "0", text: $draft.pricePaid, keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal($draft.pricePaid)
                }
                AppFormField(label: i18n.t("purchases.account", default: "Paid from")) {
                    AccountPicker(accounts: accounts, selection: $draft.accountCode)
                }
            }
        }
    }

    private func result(_ purchase: CustomerPurchaseView) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.lg) {
            HStack(spacing: Tokens.Space.sm) {
                Image(systemName: "checkmark.circle.fill").font(.system(size: 22)).foregroundStyle(Tokens.success)
                Text(i18n.t("purchases.buySuccess", default: "Phone bought and added to stock"))
                    .font(.ui(.heading)).foregroundStyle(Tokens.text)
            }
            AppCard {
                VStack(spacing: 0) {
                    FactRow(label: i18n.t("purchases.unit", default: "Phone")) { Text(purchase.unit.model.label).font(.ui(.body)) }
                    FactRow(label: i18n.t("catalog.unitCode", default: "Code")) { Text(purchase.unit.code).font(.data(.regular)) }
                    if let price = purchase.pricePaid {
                        FactRow(label: i18n.t("purchases.pricePaid", default: "Price paid"), last: true) { MoneyText(value: price, size: 15) }
                    }
                }
            }
            Button { dismiss() } label: { Text(i18n.t("common.done", default: "Done")).frame(maxWidth: .infinity) }
                .buttonStyle(.pillPrimary)
        }
    }

    private func buy() {
        guard canBuy, let payload = draft.payload(model) else { return }
        busy = true
        error = nil
        Haptic.tick.play()
        Task {
            do {
                let created = try await PurchasesRepository(container).create(payload)
                busy = false
                container.toasts.success(i18n.t("purchases.buySuccess", default: "Phone bought and added to stock"))
                onBought()
                bought = created
            } catch let e as AppError {
                busy = false
                error = PurchaseError.message(e, i18n)
            } catch {
                busy = false
                self.error = error.localizedDescription
            }
        }
    }
}
