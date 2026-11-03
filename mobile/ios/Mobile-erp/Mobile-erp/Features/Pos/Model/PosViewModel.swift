import Foundation
import Observation

/// POS terminal state + actions: scan an IMEI into the cart (gated: exists · in
/// stock · not already queued · not a duplicate), attach a customer, then check
/// out every line. One `POST /sales` per device online, or one outbox entry per
/// device offline — each with its own `expectedVersion`. The completed sales
/// drive the receipt result sheet.
@MainActor
@Observable
final class PosViewModel {
    let cart = PosCart()
    var errorKey: String?
    /// A scanned IMEI awaiting the cashier's confirm tap before it joins the cart
    /// (or an error variant explaining why it can't). Drives the confirm sheet.
    var pendingScan: PendingScan?
    var busy = false
    var completed: [CompletedSale]?
    var defaultWarrantyDays: Int?

    // Customer typeahead.
    var customerHits: [PosCustomerHit] = []

    @ObservationIgnored private var container: AppContainer?
    private var repo: PosRepository {
        PosRepository(context: container!.modelContext, api: container!.api)
    }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        Task { defaultWarrantyDays = await repo.defaultWarrantyDays() }
    }

    /// Resolve a scanned IMEI from the offline cache and stage it for confirmation
    /// (gated: exists · not already queued · in stock · not already in the cart).
    /// Nothing enters the cart here — `confirmScan()` does, after the cashier taps
    /// Confirm. A gate failure stages the matching error for the sheet's error
    /// variant.
    func scan(_ raw: String) {
        guard container != nil else { return }
        let imei = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let found = repo.lookup(imei) else {
            pendingScan = PendingScan(code: imei, device: nil, errorKey: "common.notFound"); return
        }
        if repo.pendingSoldImeis().contains(found.imei) {
            pendingScan = PendingScan(code: found.imei, device: nil, errorKey: "pos.alreadyQueued"); return
        }
        guard found.inStock else {
            pendingScan = PendingScan(code: found.imei, device: nil, errorKey: "pos.deviceConflict"); return
        }
        if cart.lines.contains(where: { $0.device.imei == found.imei }) {
            pendingScan = PendingScan(code: found.imei, device: nil, errorKey: "pos.duplicateDevice"); return
        }
        pendingScan = PendingScan(code: imei, device: found, errorKey: nil)
    }

    /// Commit the staged scan into the cart. No-op (just dismiss) for an error
    /// variant, where `device` is nil.
    func confirmScan() {
        defer { pendingScan = nil }
        guard let device = pendingScan?.device else { return }
        cart.add(device, warrantyDays: defaultWarrantyDays)
    }

    func dismissScan() { pendingScan = nil }

    /// Typeahead search for an existing customer to attach.
    func searchCustomers(_ query: String) {
        guard container != nil else { return }
        Task { customerHits = (try? await repo.lookupCustomers(query)) ?? [] }
    }

    func dismissResult() { completed = nil }

    func clearError() { errorKey = nil }

    /// Check out every cart line. Online lines POST sequentially; a line that
    /// fails the network is queued to the outbox (same `clientMutationId`), while
    /// an HTTP verdict stops the run. Offline, every line is queued. Succeeded or
    /// queued lines leave the cart so a retry is idempotent on the rest.
    func checkout() {
        guard let container, !cart.isEmpty, !busy else { return }
        busy = true
        errorKey = nil
        let online = container.connectivity.isOnline
        let cashier = container.session.user?.displayName ?? ""
        let customer = cart.customer
        let lines = cart.lines

        Task {
            var results: [CompletedSale] = []
            // ponytail: an inline NEW customer is re-sent per line (postSale
            // returns no customer id to reuse) → N lines may create N customers.
            // Mirrors the web; upgrade by creating the customer once up front and
            // attaching the returned id to every line.
            for line in lines {
                let payload = buildSalePayload(
                    imei: line.device.imei,
                    salePrice: moneyToDouble(line.price),
                    clientMutationId: line.clientMutationId,
                    expectedVersion: line.device.version,
                    customerId: customer?.id,
                    customerName: customer?.id == nil ? customer?.name : nil,
                    customerPhone: customer?.id == nil ? customer?.phone : nil,
                    warrantyDays: Int(line.warrantyDays.trimmingCharacters(in: .whitespaces)),
                    notes: line.notes
                )
                let now = Date()
                var receiptId = line.clientMutationId
                var pending = !online
                if online {
                    do {
                        let id = try await repo.postSale(payload)
                        if !id.isEmpty { receiptId = id }
                    } catch {
                        // Network failure → queue; an HTTP verdict stops the run.
                        if (error as? AppError)?.statusCode == nil {
                            try? repo.enqueueSale(payload, baseVersion: line.device.version)
                            pending = true
                        } else {
                            busy = false
                            errorKey = "common.error"
                            break
                        }
                    }
                } else {
                    try? repo.enqueueSale(payload, baseVersion: line.device.version)
                }
                results.append(completedSale(line, receiptId: receiptId,
                                              cashier: cashier, customer: customer,
                                              at: now, pending: pending))
                cart.remove(line.id)
            }
            busy = false
            if !results.isEmpty {
                container.toasts.success(i18n("pos.saleSuccess", count: results.count))
                completed = results
            }
        }
    }

    private func completedSale(_ line: PosCartLine, receiptId: String, cashier: String,
                               customer: PosCartCustomer?, at now: Date, pending: Bool) -> CompletedSale {
        let days = Int(line.warrantyDays.trimmingCharacters(in: .whitespaces))
        return CompletedSale(
            receiptId: receiptId,
            imei: line.device.imei,
            imei2: line.device.imei2,
            modelLabel: line.device.modelLabel,
            salePrice: line.price,
            soldAt: now,
            cashier: cashier,
            warrantyDays: days,
            warrantyEndsAt: days.map { now.addingTimeInterval(Double($0) * 86_400) },
            customerName: nonEmpty(customer?.name),
            pending: pending
        )
    }

    private func i18n(_ key: String, count: Int) -> String {
        container?.i18n.t(key, ["count": String(count)]) ?? key
    }
}
