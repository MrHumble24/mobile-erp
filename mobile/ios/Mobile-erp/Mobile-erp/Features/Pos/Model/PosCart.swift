import Foundation
import Observation

/// The POS cart: the devices queued for checkout and the shared customer. One
/// sale per device (the server takes a single `imei`), so each line carries its
/// own price, warranty, notes and `clientMutationId`. Client-only state.
@MainActor
@Observable
final class PosCart {
    private(set) var lines: [PosCartLine] = []
    var customer: PosCartCustomer?

    var isEmpty: Bool { lines.isEmpty }
    var count: Int { lines.count }

    /// Subtotal across all lines, exact (never via Double).
    var subtotal: Decimal {
        lines.reduce(Decimal.zero) { $0 + (Decimal(string: $1.price) ?? .zero) }
    }

    /// Add a scanned device. Returns false when its IMEI is already in the cart
    /// (the caller shows "already in cart"). Prefills price from the target.
    @discardableResult
    func add(_ device: ScannedDevice, warrantyDays: Int?) -> Bool {
        guard !lines.contains(where: { $0.device.imei == device.imei }) else { return false }
        lines.append(PosCartLine(
            id: newUUID(),
            device: device,
            price: device.targetPrice ?? "",
            warrantyDays: warrantyDays.map(String.init) ?? "",
            notes: "",
            clientMutationId: newUUID()
        ))
        return true
    }

    func remove(_ id: String) { lines.removeAll { $0.id == id } }
    func clear() { lines = []; customer = nil }

    func setPrice(_ id: String, _ value: String) { patch(id) { $0.price = value } }
    func setWarranty(_ id: String, _ value: String) { patch(id) { $0.warrantyDays = value } }
    func setNotes(_ id: String, _ value: String) { patch(id) { $0.notes = value } }

    private func patch(_ id: String, _ change: (inout PosCartLine) -> Void) {
        guard let i = lines.firstIndex(where: { $0.id == id }) else { return }
        change(&lines[i])
    }
}
