#if DEBUG
import Foundation

/// Screenshot / end-to-end debug helpers for the POS view-model. Compiled out of
/// release builds. Driven by launch arguments in `PosView`.
extension PosViewModel {
    /// Seed a demo cart line + payment method for screenshots, bypassing the
    /// cache. `mode`: "cash" | "split" | "serial" (`-posDemo`).
    func seedDemo(_ mode: String) {
        let serialDemo = mode == "serial"
        cart.add(ScannedDevice(id: "demo",
                               imei: serialDemo ? nil : "356938035643809",
                               imei2: nil,
                               serialNumber: serialDemo ? "PS5-CFI1215A" : nil,
                               version: 1, statusCode: "IN_STOCK",
                               modelLabel: serialDemo ? "Sony PlayStation 5" : "iPhone 13",
                               targetPrice: serialDemo ? "6500000" : "1200000"),
                 warrantyDays: defaultWarrantyDays)
        ensureDemoAccounts()
        if mode == "split" {
            payment.method = .split
            payment.splitAmounts = ["CASH": "800000", "CARD": "400000"]
        }
    }

    /// Seed a mixed cart from the cache: a scanned unit plus three pieces of a
    /// quantity product. `arg` is "<unitCode>,<barcode>" (`-posMix`).
    func debugSeedMix(_ arg: String) {
        let parts = arg.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        guard parts.count == 2 else { return }
        scan(parts[0]); confirmScan()
        scan(parts[1])
        if let line = cart.lines.first(where: { $0.isProduct }) { cart.setQuantity(line.id, 3) }
    }

    /// Split the current cart total half to CASH, half to CARD (exact integers).
    func debugSplitHalf() {
        ensureDemoAccounts()
        let behavior = NSDecimalNumberHandler(roundingMode: .down, scale: 0,
            raiseOnExactness: false, raiseOnOverflow: false, raiseOnUnderflow: false,
            raiseOnDivideByZero: false)
        let total = cart.subtotal as NSDecimalNumber
        let cash = total.dividing(by: NSDecimalNumber(value: 2), withBehavior: behavior).decimalValue
        let card = cart.subtotal - cash
        payment.method = .split
        payment.splitAmounts = ["CASH": NSDecimalNumber(decimal: cash).stringValue,
                                "CARD": NSDecimalNumber(decimal: card).stringValue]
    }

    /// Seed a mixed cart, split it and run a real checkout (`-posSellMix`).
    func debugSellMix(_ arg: String) {
        debugSeedMix(arg)
        debugSplitHalf()
        checkout()
    }

    /// Seed the cart from the catalog: a unit (first free one of the unit model)
    /// plus a quantity product (ADR 0031). `arg` is "<unitModelId>,<quantityModelId>".
    func debugCatalogAdd(_ arg: String, container: AppContainer) async {
        catalog.configure(container)
        let parts = arg.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        guard parts.count == 2 else { return }
        if defaultWarrantyDays == nil { defaultWarrantyDays = 365 }
        let repo = CatalogRepository(context: container.modelContext, api: container.api,
                                     isOnline: container.connectivity.isOnline)
        let entries = (try? await repo.list(categoryId: nil, search: nil)) ?? []
        if let unitEntry = entries.first(where: { $0.modelId == parts[0] }),
           let unit = (try? await repo.units(modelId: parts[0]))?.first {
            addCatalogUnit(unit, entry: unitEntry)
        }
        if let qtyEntry = entries.first(where: { $0.modelId == parts[1] && $0.isQuantity }) {
            addCatalogQuantity(qtyEntry)
        }
    }

    /// Seed from the catalog and run a real end-to-end checkout (`-posSellCatalog`).
    func debugSellCatalog(_ arg: String, container: AppContainer) async {
        await debugCatalogAdd(arg, container: container)
        checkout()
    }

    /// Seed a priced cart for the pricing screenshots (ADR 0034), bypassing the
    /// cache. `mode`: "retail" | "wholesale" | "over" | "cart3". Sets a discount
    /// config (5% cashier max, both modes, presets) so the discount surface shows.
    func debugPriceDemo(_ mode: String) {
        self.mode = .scan
        debugLockConfig = true
        cart.config = PosDiscountConfig(
            enabled: true, percentAllowed: true, amountAllowed: true,
            presetsPercent: [3, 5], presetsAmount: [20_000, 50_000],
            cashierMax: 5, canOverridePrice: false, canDiscountUnlimited: false)
        func dev(_ id: String, _ imei: String, _ label: String, _ r: String, _ w: String, _ p: String) -> ScannedDevice {
            ScannedDevice(id: id, imei: imei, imei2: nil, serialNumber: nil, version: 1,
                          statusCode: "IN_STOCK", modelLabel: label, targetPrice: r,
                          prices: PriceLevelPrices(["RETAIL": r, "WHOLESALE": w, "PARTNER": p]))
        }
        cart.add(dev("p1", "356938035643809", "iPhone 16 Pro Max", "9500000", "9200000", "9000000"), warrantyDays: 365)
        cart.add(dev("p2", "356938035643810", "iPhone 15", "7500000", "7300000", "7100000"), warrantyDays: 365)
        cart.add(dev("p3", "356938035643811", "iPhone SE", "3500000", "3400000", "3300000"), warrantyDays: 365)
        cart.setLevel(mode == "retail" ? PriceLevels.retail : PriceLevels.wholesale)
        ensureDemoAccounts()
        switch mode {
        case "retail", "wholesale", "lines":
            cart.setDiscount(cart.lines[0].id, mode: .percent, value: "3")
            cart.setDiscount(cart.lines[1].id, mode: .amount, value: "50000")
        case "over":
            cart.setDiscount(cart.lines[0].id, mode: .percent, value: "9")   // over the 5% cap
        case "cart3":
            _ = cart.applyCartDiscount(mode: .percent, value: 5)
        default:
            break
        }
        // Open the cart sheet (scrolls from the top) to show the line rows.
        if mode == "lines" || mode == "over" || mode == "cart3" { showCart = true }
    }

    /// Real end-to-end discounted sale (`-posSellDiscount "<code>,<level>,<pct>"`):
    /// waits for the unit to sync into the cache, scans it, sets the level and a
    /// percent discount, then checks out through the real POST path (ADR 0034).
    func debugSellDiscount(_ arg: String, container: AppContainer) {
        let parts = arg.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        guard let code = parts.first, !code.isEmpty else { return }
        let level = parts.count > 1 ? parts[1] : PriceLevels.wholesale
        let pct = parts.count > 2 ? parts[2] : "3"
        let repo = PosRepository(context: container.modelContext, api: container.api)
        Task {
            for _ in 0..<30 where repo.lookup(code) == nil {
                try? await Task.sleep(for: .milliseconds(500))
            }
            scan(code)
            confirmScan()
            guard let line = cart.lines.first else { return }
            cart.setLevel(level)
            cart.setDiscount(line.id, mode: .percent, value: pct)
            checkout()
        }
    }

    private func ensureDemoAccounts() {
        if payment.accounts.isEmpty {
            payment.setAccounts([PaymentAccount(code: "CASH", label: "Cash"),
                                 PaymentAccount(code: "CARD", label: "Card")])
        }
    }
}
#endif
