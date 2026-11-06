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
    /// Customer bonus state and requested points (ADR 0043, ADR 0047).
    var customerBonus: BonusView?
    var bonusRequested: Decimal = 0

    /// DEBUG only: a seeder has set `cart.config` by hand, so the async settings
    /// load must not overwrite it (used to show the cashier-limit error).
    @ObservationIgnored var debugLockConfig = false

    @ObservationIgnored private(set) var container: AppContainer?
    var repo: PosRepository {
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
    /// discount (ADR 0034) and bonus points (ADR 0043).
    func attachCustomer(_ hit: PosCustomerHit) {
        cart.attach(PosCartCustomer(id: hit.id, name: hit.name, phone: hit.phone,
                                    level: hit.level, standing: hit.standing))
        loadCustomerBonus()
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
}
