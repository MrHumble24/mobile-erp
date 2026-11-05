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
    /// Cashier shifts (ADR 0036): the till bar + the selling gate.
    let shift = ShiftModel()
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

    /// Customer credit (ADR 0035): the "On credit" sheet and whether the shop has
    /// the setting on. The entry also needs the `sale.credit` permission, which is
    /// read via `canSellCredit`. Credit is online only.
    var showCredit = false
    var creditEnabled = false

    /// The catalog grid, built lazily so it only loads when the mode is used.
    let catalog = CatalogBrowser()

    // Customer typeahead.
    var customerHits: [PosCustomerHit] = []

    /// DEBUG only: a seeder has set `cart.config` by hand, so the async settings
    /// load must not overwrite it (used to show the cashier-limit error).
    @ObservationIgnored var debugLockConfig = false

    @ObservationIgnored private(set) var container: AppContainer?
    private var repo: PosRepository {
        PosRepository(context: container!.modelContext, api: container!.api)
    }

    func configure(_ container: AppContainer) {
        guard self.container == nil else { return }
        self.container = container
        shift.configure(container)
        Task { await shift.load() }
        Task { defaultWarrantyDays = await repo.defaultWarrantyDays() }
        Task {
            payment.setAccounts(await PaymentAccounts.load(api: container.api, i18n: container.i18n))
        }
        Task { await loadDiscountConfig(container) }
    }

    /// Load the discount settings + the user's price permissions into the cart,
    /// so the till can price lines, cap discounts and offer the presets (ADR 0034).
    private func loadDiscountConfig(_ container: AppContainer) async {
        guard !debugLockConfig else { return }
        guard let settings: StoreSettings = try? await container.api.get("/settings") else {
            cart.config = PosDiscountConfig(
                canOverridePrice: container.session.can("sale.price.override"),
                canDiscountUnlimited: container.session.can("sale.discount.unlimited"))
            return
        }
        cart.config = PosDiscountConfig.from(settings, session: container.session)
        creditEnabled = settings.customerCreditEnabled
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
            statusCode: "IN_STOCK", modelLabel: entry.label, targetPrice: unit.targetPrice,
            prices: unit.prices)
        cart.add(device, warrantyDays: defaultWarrantyDays)
    }

    /// Add a quantity product tapped in the catalog grid (a re-tap raises it).
    func addCatalogQuantity(_ entry: CatalogEntry) {
        cart.addProduct(PosCartProduct(modelId: entry.modelId, name: entry.label,
                                       barcode: nil, salePrice: entry.salePrice,
                                       quantityInStock: entry.inStock, prices: entry.prices))
    }

    /// Attach an existing customer and follow their price level + standing
    /// discount (ADR 0034).
    func attachCustomer(_ hit: PosCustomerHit) {
        cart.attach(PosCartCustomer(id: hit.id, name: hit.name, phone: hit.phone,
                                    level: hit.level, standing: hit.standing))
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
    /// the cart's single Cash/Card/Split choice is allocated across each line's
    /// **payable** amount — its price minus the trade-ins placed on it (ADR 0039)
    /// — so each sale's payments sum to `salePrice − Σ trade-in values`. A sale
    /// with a trade-in is online only and is never queued; a sold line's trade-ins
    /// are dropped so a retry after a partial failure never resends them. Offline,
    /// every (trade-in-free) line queues. Payload + result building live in
    /// `PosCheckoutPayload`.
    func checkout() {
        guard let container, !cart.isEmpty, !busy else { return }
        let online = container.connectivity.isOnline
        // Trade-ins are online only — never queued (the server refuses them there).
        if cart.hasTradeIns && !online { errorKey = "purchases.tradeInOffline"; return }
        let plan = planCartTradeIns()
        guard plan.ok else { errorKey = "purchases.tradeInExceedsLine"; return }
        // Shifts (ADR 0036): online, selling needs an open shift; offline is let
        // through (the server trusts replays). Keep the cart and prompt to open.
        guard !shift.blocksSale(online: online) else { errorKey = "shifts.shiftRequired"; return }
        busy = true
        errorKey = nil
        let cashier = container.session.user?.displayName ?? ""
        let customer = cart.customer
        let lines = cart.lines
        let perLinePayments = allocateSalePayments(
            breakdown: payment.breakdown(total: plan.amountToPay),
            linePrices: lines.map { plan.payableByLine[$0.id] ?? cart.finalTotal($0) })

        Task {
            var results: [CompletedSale] = []
            for (index, line) in lines.enumerated() {
                let tradeIns = tradeInPosts(for: line.id, plan: plan)
                let payload = payload(for: line, customer: customer,
                                      payments: perLinePayments[index], tradeIns: tradeIns)
                let now = Date()
                var receiptId = line.clientMutationId
                var pending = !online
                if online {
                    do {
                        let id = try await repo.postSale(payload)
                        if !id.isEmpty { receiptId = id }
                        // Sold with its trade-ins — drop them so a retry never resends them.
                        for t in plan.itemsByLine[line.id] ?? [] { cart.removeTradeIn(t) }
                    } catch {
                        let appError = error as? AppError
                        if appError?.statusCode == nil {
                            // A trade-in sale must never queue offline (server refuses it).
                            if tradeIns == nil {
                                try? repo.enqueueSale(payload, baseVersion: line.device?.version)
                                pending = true
                            } else {
                                busy = false; errorKey = "purchases.tradeInOffline"; break
                            }
                        } else if appError?.statusCode == 409, appError?.code == "NO_OPEN_SHIFT" {
                            busy = false; errorKey = "shifts.shiftRequired"
                            await shift.refresh(); break   // keep the cart
                        } else if appError?.statusCode == 403, appError?.code == "TRADE_IN_FORBIDDEN" {
                            busy = false; errorKey = "common.error"; break
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
                container.toasts.success(container.i18n.t("pos.saleSuccess", ["count": String(results.count)]))
                showCart = false   // close the catalog cart sheet before the receipt
                completed = results
                payment.method = .cash
                payment.splitAmounts = [:]
            }
        }
    }
}
