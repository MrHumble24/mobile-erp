import SwiftUI

/// POS terminal (Kassa) — the Warm Card first viewport: a warm ground, the white
/// scan card, each unit a white card, a mono total, and the one orange pay
/// button. Scan IMEIs into a multi-device cart, price and warrant each line,
/// attach a customer, then check out (one sale per device). Works offline —
/// lookups come from the cache and each sale queues to the outbox.
struct PosView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = PosViewModel()

    /// Screenshot helper: `-posDemo …` starts the scroll at the checkout bar so
    /// the payment control is captured. Normal launches anchor at the top.
    private var demoScrollAnchor: UnitPoint {
        #if DEBUG
        let keys = ["posDemo", "posSplit", "posSellMix"]
        if keys.contains(where: { UserDefaults.standard.string(forKey: $0) != nil }) { return .bottom }
        #endif
        return .top
    }

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                ScannerField(placeholder: i18n.t("pos.scanPrompt")) { model.scan($0) }

                if let key = model.errorKey {
                    AppCard { PosScanErrorRow(key: key) { model.clearError() } }
                }

                if model.cart.isEmpty {
                    PosEmptyScanLanding()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                } else {
                    Text(i18n.t("pos.lineCount", ["count": String(model.cart.count)]))
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                    VStack(spacing: Tokens.Space.lg) {
                        ForEach(model.cart.lines) { line in
                            PosCartLineRow(cart: model.cart, line: line)
                                .captureSpringRow()
                        }
                    }
                    .captureSpringList(model.cart.lines.map(\.id), count: model.cart.count)
                    PosCustomerPanel(model: model)
                    PosCheckoutBar(model: model)
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.lg)
        }
        .defaultScrollAnchor(demoScrollAnchor)
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.ground)
        .navigationTitle(i18n.t("pos.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { model.showProductSearch = true } label: {
                    Label(i18n.t("catalog.addToCart"), systemImage: "plus")
                }
            }
        }
        .appSheet(isPresented: $model.showProductSearch) {
            PosProductSearchSheet { model.addProduct($0) }
        }
        // Capture spring (list insertions) + the haptic vocabulary: a completed
        // sale is success, a rejected/duplicate scan is error. The scan itself
        // ticks in ScannerField.
        .sensoryFeedback(trigger: model.completed?.count ?? 0) { old, new in new > old ? .success : nil }
        .sensoryFeedback(trigger: model.pendingScan?.errorKey) { _, new in new != nil ? .error : nil }
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
            _ = PosPaymentsSelfCheck.ran
            if let mode = KitDebugLaunch.consume("posDemo") { model.seedDemo(mode) }
            // `-posScan <code>` adds a cached unit to the cart (no checkout) so a
            // capture shows the cart line at the top of the list.
            if let code = KitDebugLaunch.consume("posScan") {
                model.scan(code)
                model.confirmScan()
            }
            // `-posSell <code>` runs a real end-to-end checkout of a cached unit
            // (scan → confirm → POST /sales) — drives the production VM path.
            if let code = KitDebugLaunch.consume("posSell") {
                model.scan(code)
                model.confirmScan()
                model.checkout()
            }
            // `-posMix "<unitCode>,<barcode>"` seeds a mixed cart (phone + 3 pieces);
            // add `-posSplit 1` to split it. `-posSellMix "…"` runs a real checkout.
            if let arg = KitDebugLaunch.consume("posMix") { model.debugSeedMix(arg) }
            if KitDebugLaunch.consume("posSplit") != nil { model.debugSplitHalf() }
            if let arg = KitDebugLaunch.consume("posSellMix") { model.debugSellMix(arg) }
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
                    ? "IMEI: \(device.imei ?? "") · \(i18n.t("inventory.imei2", default: "IMEI 2")): \(device.imei2!)"
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
