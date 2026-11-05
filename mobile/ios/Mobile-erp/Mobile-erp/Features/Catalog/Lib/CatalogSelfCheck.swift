#if DEBUG
import Foundation

/// Self-checks for the till catalog (ADR 0031): the tap rules (quantity product,
/// one unit, several units, a unit already in the cart) and the offline grid
/// build from cached rows. Assert-based; runs once on first catalog appear.
enum CatalogSelfCheck {
    static let ran: Void = {
        checkTapRules()
        checkOfflineGrid()
    }()

    private static func unit(_ id: String, _ code: String) -> CatalogUnit {
        CatalogUnit(id: id, code: code, specs: ["storage": "256 GB", "color": "Black"],
                    gradeCode: "A", targetPrice: "1000000")
    }

    private static func entry(_ kind: String) -> CatalogEntry {
        CatalogEntry(modelId: "m1", brand: "Apple", name: "iPhone 15", kindCode: kind,
                     categoryId: "c1", categoryName: nil, imageUrl: nil, inStock: 2,
                     minTargetPrice: "1000000", maxTargetPrice: "1200000", salePrice: nil,
                     prices: PriceLevelPrices())
    }

    private static func checkTapRules() {
        // A quantity product goes straight to the cart.
        if case .quantity = CatalogPick.tap(entry("QUANTITY")) {} else { assertionFailure("quantity tap") }
        // A unit product must fetch its units first.
        if case .needsUnits = CatalogPick.tap(entry("IMEI")) {} else { assertionFailure("unit tap") }

        let u1 = unit("u1", "111111111111111"), u2 = unit("u2", "222222222222222")
        // Several free units → the picker.
        if case .pick(let free) = CatalogPick.resolveUnits([u1, u2], excludingCodes: []) {
            assert(free.count == 2)
        } else { assertionFailure("several units → pick") }
        // Exactly one free unit → added directly.
        if case .one(let only) = CatalogPick.resolveUnits([u1], excludingCodes: []) {
            assert(only.id == "u1")
        } else { assertionFailure("one unit → one") }
        // A unit already in the cart is not offered again.
        if case .none = CatalogPick.resolveUnits([u1], excludingCodes: [u1.code]) {} else {
            assertionFailure("only unit already in cart → none")
        }
        if case .one(let other) = CatalogPick.resolveUnits([u1, u2], excludingCodes: [u1.code]) {
            assert(other.id == "u2")
        } else { assertionFailure("one of two already in cart → the other") }
    }

    private static func checkOfflineGrid() {
        func device(_ id: String, _ status: String, _ price: String) -> CatalogCachedDevice {
            CatalogCachedDevice(id: id, imei: id, serialNumber: nil, statusCode: status,
                                kindCode: "IMEI", targetPrice: price, storage: "256 GB", color: "Black",
                                gradeCode: "A", modelId: "mA", brand: "Apple", name: "iPhone 15",
                                categoryId: "c1", imageUrl: "/uploads/a.png", prices: PriceLevelPrices())
        }
        let devices = [device("d1", "IN_STOCK", "1000000"),
                       device("d2", "IN_STOCK", "1200000"),
                       device("d3", "SOLD", "900000")]   // sold → dropped
        let products = [CatalogCachedProduct(modelId: "mB", brand: "Generic", name: "Cable",
                                             salePrice: "90000", quantity: 5,
                                             categoryId: "c2", imageUrl: nil, prices: PriceLevelPrices())]

        let all = CatalogOffline.entries(devices: devices, products: products, categoryId: nil, search: nil)
        assert(all.count == 2)   // one unit card + one quantity card
        let phone = all.first { $0.modelId == "mA" }!
        assert(phone.inStock == 2 && phone.minTargetPrice == "1000000" && phone.maxTargetPrice == "1200000")
        let cable = all.first { $0.modelId == "mB" }!
        assert(cable.isQuantity && cable.inStock == 5 && cable.salePrice == "90000")

        // Category + search filters, and the SOLD unit stays out of the picker.
        assert(CatalogOffline.entries(devices: devices, products: products, categoryId: "c2", search: nil).count == 1)
        assert(CatalogOffline.entries(devices: devices, products: products, categoryId: nil, search: "cable").count == 1)
        assert(CatalogOffline.units(devices: devices, modelId: "mA").count == 2)
    }
}
#endif
