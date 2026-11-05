import SwiftUI

/// POS terminal (Kassa) — the Warm Card first viewport. A mode switch at the top
/// chooses Scan (type/scan a code into the cart) or Catalog (a product grid, ADR
/// 0031); both feed the same cart. Attach a customer, then check out (one sale
/// per line). Works offline — lookups and the grid come from the cache and each
/// sale queues to the outbox.
struct PosView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = PosViewModel()

    var body: some View {
        @Bindable var model = model
        VStack(spacing: 0) {
            ShiftBar(model: model.shift)
            SegmentedControl(selection: $model.mode,
                             segments: PosMode.allCases.map { ($0, i18n.t($0.labelKey)) })
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.sm)
            switch model.mode {
            case .scan: PosScanPane(model: model)
            case .catalog: PosCatalogPane(model: model)
            }
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("pos.title"))
        .toolbar {
            if model.mode == .scan {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { model.showProductSearch = true } label: {
                        Label(i18n.t("catalog.addToCart"), systemImage: "plus")
                    }
                }
            }
        }
        .appSheet(isPresented: $model.showProductSearch) {
            PosProductSearchSheet { model.addProduct($0) }
        }
        .appSheet(isPresented: $model.showCart) {
            ScrollView { PosCartColumn(model: model).padding(Tokens.Space.gutter) }
                .background(Tokens.card)
        }
        .sheet(isPresented: $model.showCredit) {
            CreditSheet(
                lines: model.creditLines(), dueTotal: model.cart.subtotal,
                customerId: model.creditCustomerId, customerName: model.creditCustomerName,
                customerPhone: model.creditCustomerPhone,
                onSold: { model.onCreditSold() })
        }
        // Capture spring (list insertions) + the haptic vocabulary: a completed
        // sale is success, a rejected/duplicate scan is error.
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
            _ = PricingSelfCheck.ran
            _ = CatalogSelfCheck.ran
            runDebugLaunch()
            #endif
        }
        .onChange(of: container.router.pending) { _, _ in consumeRoute() }
    }

    /// Build the confirm sheet's content: the device summary, or the error
    /// variant for a scan that failed a gate.
    private func scanContent(_ scan: PendingScan) -> ScanConfirmSheet.Content {
        if let device = scan.device {
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
        model.mode = .scan
        model.scan(imei)
    }

    #if DEBUG
    /// Launch-argument screenshot / end-to-end helpers (see SCREENS.md).
    private func runDebugLaunch() {
        if let mode = KitDebugLaunch.consume("posDemo") { model.seedDemo(mode) }
        if let mode = KitDebugLaunch.consume("posPriceDemo") { model.debugPriceDemo(mode) }
        if let arg = KitDebugLaunch.consume("posSellDiscount") { model.debugSellDiscount(arg, container: container) }
        if let code = KitDebugLaunch.consume("posScan") { model.scan(code); model.confirmScan() }
        if KitDebugLaunch.consume("posCredit") != nil { model.debugOpenCredit() }
        if KitDebugLaunch.consume("posTradeIn") != nil { model.debugSeedTradeIn() }
        if KitDebugLaunch.consume("posShiftOpen") != nil {
            Task { await model.shift.load(); model.shift.showOpen = true }
        }
        if KitDebugLaunch.consume("posShiftClose") != nil {
            Task { await model.shift.load(); model.shift.showClose = true }
        }
        if let code = KitDebugLaunch.consume("posSell") {
            model.scan(code); model.confirmScan(); model.checkout()
        }
        if let arg = KitDebugLaunch.consume("posMix") { model.debugSeedMix(arg) }
        if KitDebugLaunch.consume("posSplit") != nil { model.debugSplitHalf() }
        if let arg = KitDebugLaunch.consume("posSellMix") { model.debugSellMix(arg) }
        // Catalog (ADR 0031): switch mode, seed from the catalog (bar visible),
        // seed + open the cart, or run a real catalog checkout. Each "<u>,<q>" is
        // a unit model id and a quantity model id.
        if KitDebugLaunch.consume("posCatalog") != nil { model.mode = .catalog }
        if let level = KitDebugLaunch.consume("posLevel") { model.cart.setLevel(level) }
        if let arg = KitDebugLaunch.consume("posCatalogAdd") {
            model.mode = .catalog
            Task { await model.debugCatalogAdd(arg, container: container) }
        }
        if let arg = KitDebugLaunch.consume("posCatalogCart") {
            model.mode = .catalog
            Task { await model.debugCatalogAdd(arg, container: container); model.showCart = true }
        }
        if let arg = KitDebugLaunch.consume("posSellCatalog") {
            model.mode = .catalog
            Task { await model.debugSellCatalog(arg, container: container) }
        }
    }
    #endif
}

/// Identifiable wrapper so `[CompletedSale]` drives a `.sheet(item:)`.
private struct CompletedSalesBox: Identifiable {
    let sales: [CompletedSale]
    var id: String { sales.map(\.receiptId).joined() }
}
