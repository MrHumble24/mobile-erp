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

    private func ensureDemoAccounts() {
        if payment.accounts.isEmpty {
            payment.setAccounts([PaymentAccount(code: "CASH", label: "Cash"),
                                 PaymentAccount(code: "CARD", label: "Card")])
        }
    }
}
#endif
