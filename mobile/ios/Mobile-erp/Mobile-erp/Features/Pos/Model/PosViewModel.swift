import Foundation
import Observation

/// POS terminal state + actions: resolve a scanned IMEI from the local cache,
/// gate it (exists · in stock · not already queued), then check out online or
/// enqueue offline. A completed sale drives the receipt sheet.
@MainActor
@Observable
final class PosViewModel {
    var device: ScannedDevice?
    var errorKey: String?
    var busy = false
    var completed: CompletedSale?
    var defaultWarrantyDays: Int?

    @ObservationIgnored private var container: AppContainer?
    private var repo: PosRepository {
        PosRepository(context: container!.modelContext, api: container!.api)
    }

    /// Wire the container once (from the view's `.task`) and prefetch settings.
    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        Task { defaultWarrantyDays = await repo.defaultWarrantyDays() }
    }

    func scan(_ raw: String) {
        guard container != nil else { return }
        reset()
        busy = true
        let imei = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let found = repo.lookup(imei) else {
            busy = false; errorKey = "common.notFound"; return
        }
        if repo.pendingSoldImeis().contains(found.imei) {
            busy = false; errorKey = "pos.alreadyQueued"; return
        }
        guard found.inStock else {
            busy = false; errorKey = "pos.deviceConflict"; return
        }
        busy = false
        device = found
    }

    func dismissReceipt() { reset() }

    /// Checkout the scanned device. Online → `POST /sales`; offline → outbox.
    /// Either way a `CompletedSale` is produced from local data for the receipt.
    func checkout(
        salePrice: String,
        warrantyDays: Int?,
        customerName: String?,
        customerPhone: String?,
        notes: String?
    ) {
        guard let container, let device else { return }
        busy = true
        errorKey = nil

        let mutationId = newUUID()
        let payload = buildSalePayload(
            imei: device.imei,
            salePrice: moneyToDouble(salePrice),
            clientMutationId: mutationId,
            expectedVersion: device.version,
            customerId: nil,
            customerName: customerName,
            customerPhone: customerPhone,
            warrantyDays: warrantyDays,
            notes: notes
        )
        let online = container.connectivity.isOnline
        let now = Date()
        let cashier = container.session.user?.displayName ?? ""

        Task {
            do {
                var receiptId = mutationId
                if online {
                    let id = try await repo.postSale(payload)
                    if !id.isEmpty { receiptId = id }
                } else {
                    try repo.enqueueSale(payload, baseVersion: device.version)
                }
                completed = CompletedSale(
                    receiptId: receiptId,
                    imei: device.imei,
                    modelLabel: device.modelLabel,
                    salePrice: salePrice,
                    soldAt: now,
                    cashier: cashier,
                    warrantyDays: warrantyDays,
                    warrantyEndsAt: warrantyDays.map {
                        now.addingTimeInterval(Double($0) * 86_400)
                    },
                    customerName: nonEmpty(customerName),
                    pending: !online
                )
                busy = false
            } catch {
                busy = false
                errorKey = "common.error"
            }
        }
    }

    private func reset() {
        device = nil
        errorKey = nil
        busy = false
        completed = nil
    }
}
