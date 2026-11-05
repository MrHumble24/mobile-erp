import Foundation
import Observation

/// The POS cart: the units and quantity products queued for checkout and the
/// shared customer. One sale request per line (the server takes a single unit or
/// one modelId+quantity), so each line carries its own price, quantity, warranty,
/// notes and `clientMutationId`. Client-only state.
@MainActor
@Observable
final class PosCart {
    private(set) var lines: [PosCartLine] = []
    var customer: PosCartCustomer?

    var isEmpty: Bool { lines.isEmpty }
    var count: Int { lines.count }

    /// Subtotal across all lines (per-piece × quantity for products), exact.
    var subtotal: Decimal {
        lines.reduce(Decimal.zero) { $0 + $1.lineTotal }
    }

    /// Add a scanned unit. Returns false when its code is already in the cart
    /// (the caller shows "already in cart"). Prefills price from the target.
    @discardableResult
    func add(_ device: ScannedDevice, warrantyDays: Int?) -> Bool {
        guard !lines.contains(where: { $0.device?.code == device.code }) else { return false }
        lines.append(PosCartLine(
            id: newUUID(),
            device: device,
            product: nil,
            price: device.targetPrice ?? "",
            quantity: 1,
            warrantyDays: warrantyDays.map(String.init) ?? "",
            notes: "",
            clientMutationId: newUUID()
        ))
        return true
    }

    /// Add a quantity product. A re-scan of the same product raises its quantity
    /// instead of adding a second line (ADR 0030). No warranty on a quantity sale.
    func addProduct(_ product: PosCartProduct) {
        if let i = lines.firstIndex(where: { $0.product?.modelId == product.modelId }) {
            lines[i].quantity += 1
            return
        }
        lines.append(PosCartLine(
            id: newUUID(),
            device: nil,
            product: product,
            price: product.salePrice ?? "",
            quantity: 1,
            warrantyDays: "",
            notes: "",
            clientMutationId: newUUID()
        ))
    }

    func remove(_ id: String) { lines.removeAll { $0.id == id } }
    func clear() { lines = []; customer = nil }

    func setPrice(_ id: String, _ value: String) { patch(id) { $0.price = value } }
    func setWarranty(_ id: String, _ value: String) { patch(id) { $0.warrantyDays = value } }
    func setNotes(_ id: String, _ value: String) { patch(id) { $0.notes = value } }
    /// Set a quantity line's pieces (floored at 1).
    func setQuantity(_ id: String, _ value: Int) { patch(id) { $0.quantity = max(1, value) } }

    private func patch(_ id: String, _ change: (inout PosCartLine) -> Void) {
        guard let i = lines.firstIndex(where: { $0.id == id }) else { return }
        change(&lines[i])
    }
}
