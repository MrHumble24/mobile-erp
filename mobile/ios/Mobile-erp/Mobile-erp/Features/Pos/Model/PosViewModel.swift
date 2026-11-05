import Foundation
import Observation

/// POS terminal state + actions: scan a code into the cart — a unit (gated:
/// exists · in stock · not already queued · not a duplicate) confirmed into the
/// cart, or a quantity product's barcode added straight in (ADR 0030) — attach a
/// customer, then check out every line. One `POST /sales` per line online, or one
/// outbox entry per line offline. The completed sales drive the receipt sheet.
@MainActor
@Observable
final class PosViewModel {
    let cart = PosCart()
    /// How the customer pays (Cash / Card / Split). Default Cash.
    let payment = PaymentSelection()
    var errorKey: String?
    /// A scanned unit awaiting the cashier's confirm tap before it joins the cart
    /// (or an error variant explaining why it can't). Drives the confirm sheet.
    var pendingScan: PendingScan?
    var busy = false
    var completed: [CompletedSale]?
    var defaultWarrantyDays: Int?
    var showProductSearch = false
    /// The till's cart sheet (phone catalog mode: the grid fills the screen and a
    /// bar opens the cart + checkout).
    var showCart = false
    /// Scan (today's screen) vs Catalog (the product grid). Remembered per device.
    var mode: PosMode = PosMode.loadRemembered() {
        didSet { if mode != oldValue { PosMode.remember(mode) } }
    }

    /// The catalog grid, built lazily so it only loads when the mode is used.
    let catalog = CatalogBrowser()

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
        Task {
            payment.setAccounts(await PaymentAccounts.load(api: container.api, i18n: container.i18n))
        }
    }

    /// Resolve a scanned code. A unit (IMEI/serial) wins and is staged for the
    /// confirm sheet (gated); a quantity product's barcode is added straight to
    /// the cart (a re-scan raises the quantity). Units and cached products resolve
    /// offline; online, an un-cached barcode is resolved via `GET /scan/:code`.
    func scan(_ raw: String) {
        guard let container else { return }
        let code = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !code.isEmpty else { return }
        // 1. Unit (wins) — local cache, works offline and online.
        if let found = repo.lookup(code) {
            stageUnit(found)
            return
        }
        // 2. Quantity product barcode — local cache.
        if let product = repo.lookupProduct(code) {
            cart.addProduct(product)
            return
        }
        // 3. Online fallback for a product not yet synced to the cache.
        if container.connectivity.isOnline {
            Task {
                if let product = try? await repo.scanProduct(code) {
                    cart.addProduct(product)
                } else {
                    pendingScan = PendingScan(code: code, device: nil, errorKey: "common.notFound")
                }
            }
            return
        }
        pendingScan = PendingScan(code: code, device: nil, errorKey: "common.notFound")
    }

    /// Stage a resolved unit for confirmation, running the sell gates.
    private func stageUnit(_ found: ScannedDevice) {
        if repo.pendingSoldCodes().contains(found.code) {
            pendingScan = PendingScan(code: found.code, device: nil, errorKey: "pos.alreadyQueued"); return
        }
        guard found.inStock else {
            pendingScan = PendingScan(code: found.code, device: nil, errorKey: "pos.deviceConflict"); return
        }
        if cart.lines.contains(where: { $0.device?.code == found.code }) {
            pendingScan = PendingScan(code: found.code, device: nil, errorKey: "pos.duplicateDevice"); return
        }
        pendingScan = PendingScan(code: found.code, device: found, errorKey: nil)
    }

    /// Commit the staged unit into the cart. No-op (just dismiss) for an error
    /// variant, where `device` is nil.
    func confirmScan() {
        defer { pendingScan = nil }
        guard let device = pendingScan?.device else { return }
        cart.add(device, warrantyDays: defaultWarrantyDays)
    }

    func dismissScan() { pendingScan = nil }

    /// Add a quantity product found by name search (`GET /stock?search=`).
    func addProduct(_ product: PosCartProduct) { cart.addProduct(product) }

    /// Add a unit tapped in the catalog grid (ADR 0031). A catalog unit carries no
    /// cached version, so `expectedVersion` is omitted and the server uses the
    /// device's current version. Dedupe by code is handled by the cart.
    func addCatalogUnit(_ unit: CatalogUnit, entry: CatalogEntry) {
        let isImei = entry.kindCode == "IMEI"
        let device = ScannedDevice(
            id: unit.id, imei: isImei ? unit.code : nil, imei2: nil,
            serialNumber: isImei ? nil : unit.code, version: nil,
            statusCode: "IN_STOCK", modelLabel: entry.label, targetPrice: unit.targetPrice)
        cart.add(device, warrantyDays: defaultWarrantyDays)
    }

    /// Add a quantity product tapped in the catalog grid (a re-tap raises it).
    func addCatalogQuantity(_ entry: CatalogEntry) {
        cart.addProduct(PosCartProduct(modelId: entry.modelId, name: entry.label,
                                       barcode: nil, salePrice: entry.salePrice,
                                       quantityInStock: entry.inStock))
    }

    /// Unit codes already in the cart — the catalog won't offer them again.
    var cartUnitCodes: Set<String> { Set(cart.lines.compactMap { $0.device?.code }) }

    /// Typeahead search for an existing customer to attach.
    func searchCustomers(_ query: String) {
        guard container != nil else { return }
        Task { customerHits = (try? await repo.lookupCustomers(query)) ?? [] }
    }

    func dismissResult() { completed = nil }
    func clearError() { errorKey = nil }

    /// Check out every cart line (unit or quantity product). One request per line;
    /// the cart's single Cash/Card/Split choice is allocated across the line totals
    /// so each sale's payments sum to its own price. Offline, every line queues.
    func checkout() {
        guard let container, !cart.isEmpty, !busy else { return }
        busy = true
        errorKey = nil
        let online = container.connectivity.isOnline
        let cashier = container.session.user?.displayName ?? ""
        let customer = cart.customer
        let lines = cart.lines
        let perLinePayments = allocateSalePayments(
            breakdown: payment.breakdown(total: cart.subtotal),
            linePrices: lines.map { $0.lineTotal })

        Task {
            var results: [CompletedSale] = []
            for (index, line) in lines.enumerated() {
                let payload = payload(for: line, customer: customer, payments: perLinePayments[index])
                let now = Date()
                var receiptId = line.clientMutationId
                var pending = !online
                if online {
                    do {
                        let id = try await repo.postSale(payload)
                        if !id.isEmpty { receiptId = id }
                    } catch {
                        if (error as? AppError)?.statusCode == nil {
                            try? repo.enqueueSale(payload, baseVersion: line.device?.version)
                            pending = true
                        } else {
                            busy = false; errorKey = "common.error"; break
                        }
                    }
                } else {
                    try? repo.enqueueSale(payload, baseVersion: line.device?.version)
                }
                results.append(completedSale(line, receiptId: receiptId, cashier: cashier,
                                             customer: customer, at: now, pending: pending))
                cart.remove(line.id)
            }
            busy = false
            if !results.isEmpty {
                container.toasts.success(i18n("pos.saleSuccess", count: results.count))
                showCart = false   // close the catalog cart sheet before the receipt
                completed = results
                payment.method = .cash
                payment.splitAmounts = [:]
            }
        }
    }

    /// Build the sale request for a line: a unit (imei/serial + version) or a
    /// quantity product (modelId + quantity, no warranty). `salePrice` is the line
    /// total; a new inline customer is re-sent per line (mirrors the web).
    private func payload(for line: PosCartLine, customer: PosCartCustomer?,
                         payments: [SalePaymentPost]) -> SaleCreatePayload {
        let total = NSDecimalNumber(decimal: line.lineTotal).doubleValue
        if let product = line.product {
            return buildSalePayload(
                modelId: product.modelId, quantity: line.quantity, salePrice: total,
                clientMutationId: line.clientMutationId,
                customerId: customer?.id,
                customerName: customer?.id == nil ? customer?.name : nil,
                customerPhone: customer?.id == nil ? customer?.phone : nil,
                warrantyDays: nil, notes: line.notes, payments: payments)
        }
        return buildSalePayload(
            imei: line.device?.imei, serialNumber: line.device?.serialNumber, salePrice: total,
            clientMutationId: line.clientMutationId, expectedVersion: line.device?.version,
            customerId: customer?.id,
            customerName: customer?.id == nil ? customer?.name : nil,
            customerPhone: customer?.id == nil ? customer?.phone : nil,
            warrantyDays: Int(line.warrantyDays.trimmingCharacters(in: .whitespaces)),
            notes: line.notes, payments: payments)
    }

    private func completedSale(_ line: PosCartLine, receiptId: String, cashier: String,
                               customer: PosCartCustomer?, at now: Date, pending: Bool) -> CompletedSale {
        let days = line.isProduct ? nil : Int(line.warrantyDays.trimmingCharacters(in: .whitespaces))
        return CompletedSale(
            receiptId: receiptId,
            imei: line.device?.imei,
            imei2: line.device?.imei2,
            serialNumber: line.device?.serialNumber,
            modelLabel: line.modelLabel,
            quantity: line.isProduct ? line.quantity : nil,
            unitPrice: line.isProduct ? line.price : nil,
            salePrice: NSDecimalNumber(decimal: line.lineTotal).stringValue,
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
