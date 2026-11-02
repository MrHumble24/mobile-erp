import SwiftUI

/// POS terminal: scan IMEIs into a multi-device cart, set each line's price and
/// warranty, attach a customer, then check out (one sale per device). Works
/// offline — lookups come from the cache and each sale queues to the outbox.
/// Completed sales open the receipt result sheet.
struct PosView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = PosViewModel()

    var body: some View {
        @Bindable var model = model
        Form {
            Section {
                ScannerField(placeholder: i18n.t("pos.scanPrompt")) { model.scan($0) }
                    .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
            }

            if let key = model.errorKey {
                Section {
                    Label(errorText(key), systemImage: "exclamationmark.triangle")
                        .foregroundStyle(Tokens.warning)
                }
            }

            if model.cart.isEmpty {
                Section {
                    EmptyStateView(systemImage: "qrcode.viewfinder",
                                   title: i18n.t("pos.cartEmpty"))
                        .frame(maxWidth: .infinity)
                }
                .listRowBackground(Color.clear)
            } else {
                Section(i18n.t("pos.lineCount")) {
                    ForEach(model.cart.lines) { line in
                        PosCartLineRow(cart: model.cart, line: line)
                    }
                }
                PosCustomerPanel(model: model)
                PosCheckoutBar(model: model)
            }
        }
        .navigationTitle(i18n.t("pos.title"))
        .sheet(item: Binding(get: { model.completed.map(CompletedSalesBox.init) },
                             set: { if $0 == nil { model.dismissResult() } })) { box in
            PosCheckoutResultSheet(sales: box.sales) { model.dismissResult() }
        }
        .task {
            model.configure(container)
            #if DEBUG
            _ = PosSelfCheck.ran
            #endif
        }
    }

    private func errorText(_ key: String) -> String {
        switch key {
        case "pos.alreadyQueued":
            return i18n.t(key, default: "Already queued for sync")
        case "pos.duplicateDevice":
            return i18n.t(key, default: "Device is already in the cart")
        default:
            return i18n.t(key)
        }
    }
}

/// Identifiable wrapper so `[CompletedSale]` drives a `.sheet(item:)`.
private struct CompletedSalesBox: Identifiable {
    let sales: [CompletedSale]
    var id: String { sales.map(\.receiptId).joined() }
}
