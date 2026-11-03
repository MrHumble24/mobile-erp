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
                    PosScanErrorRow(key: key) { model.clearError() }
                }
            }

            if model.cart.isEmpty {
                Section {
                    PosEmptyScanLanding()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
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
        .scrollDismissesKeyboard(.interactively)
        .animation(.snappy(duration: 0.25), value: model.cart.isEmpty)
        .navigationTitle(i18n.t("pos.title"))
        .sheet(item: Binding(get: { model.completed.map(CompletedSalesBox.init) },
                             set: { if $0 == nil { model.dismissResult() } })) { box in
            PosCheckoutResultSheet(sales: box.sales) { model.dismissResult() }
        }
        .sheet(item: $model.pendingScan) { scan in
            ScanConfirmSheet(
                code: scan.code,
                content: scanContent(scan),
                confirmLabel: i18n.t("common.add", default: "Add"),
                onConfirm: { model.confirmScan() },
                onDismiss: { model.dismissScan() }
            )
        }
        .task {
            model.configure(container)
            consumeRoute()
            #if DEBUG
            _ = PosSelfCheck.ran
            #endif
        }
        .onChange(of: container.router.pending) { _, _ in consumeRoute() }
    }

    /// Build the confirm sheet's content: the device summary, or the error
    /// variant for a scan that failed a gate.
    private func scanContent(_ scan: PendingScan) -> ScanConfirmSheet.Content {
        if let device = scan.device {
            // Resolved via the second IMEI → show both so the cashier sees the match.
            let viaImei2 = device.imei2 != nil && scan.code == device.imei2
            return .summary(
                title: device.modelLabel,
                subtitle: viaImei2
                    ? "IMEI: \(device.imei) · \(i18n.t("inventory.imei2", default: "IMEI 2")): \(device.imei2!)"
                    : nil,
                price: device.targetPrice,
                statusLabel: i18n.t("inventory.statusInStock", default: "In Stock"),
                statusColor: Tokens.deviceStatusColor(device.statusCode)
            )
        }
        let key = scan.errorKey ?? "common.error"
        return .error(title: PosScanError.title(key, i18n), detail: PosScanError.hint(key, i18n))
    }

    /// Pick up a cross-feature `.pos(imei:)` route (e.g. inventory's "Sell in
    /// POS") and add the device to the cart exactly like a scan.
    private func consumeRoute() {
        guard case let .pos(imei) = container.router.consume("pos"), let imei else { return }
        model.scan(imei)
    }
}

/// Identifiable wrapper so `[CompletedSale]` drives a `.sheet(item:)`.
private struct CompletedSalesBox: Identifiable {
    let sales: [CompletedSale]
    var id: String { sales.map(\.receiptId).joined() }
}
