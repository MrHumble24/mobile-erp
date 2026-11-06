import Foundation
import SwiftData

/// Cached device from `/sync/changes`. Cost fields are intentionally absent —
/// the server redacts them from the feed for under-privileged users, so they
/// are never part of the offline cache. JSON blobs are stored as text.
@Model
final class DeviceEntity {
    @Attribute(.unique) var id: String
    /// Null on a serial unit (ADR 0029). Both new fields are optional so an old
    /// cached row (written before product kinds) still migrates and loads.
    var imei: String?
    var imei2: String?
    var serialNumber: String?
    /// The model's kind: IMEI | SERIAL | QUANTITY (nil on old cached rows).
    var kindCode: String?
    var statusCode: String
    var version: Int
    var targetPrice: String?   // Decimal string
    var specsJSON: String      // JSON object
    var modelId: String
    var modelBrand: String
    var modelName: String
    var latestSaleJSON: String?
    var gradeCode: String?
    var inspectionNotes: String?
    var updatedAt: String
    /// The model's picture path + category (ADR 0031), carried on the feed so the
    /// offline catalog grid can draw a card. Optional — an older cached row loads
    /// without them (migrates by adding the columns).
    var modelImageUrl: String?
    var modelCategoryId: String?
    /// Resolved list prices per level (ADR 0034), as a JSON object string, carried
    /// on the feed so an offline till prices every level. Optional — an older
    /// cached row loads without it (migrates by adding the column).
    var pricesJSON: String?

    /// The code to show the user: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }

    init(id: String, imei: String?, imei2: String?, serialNumber: String?, kindCode: String?,
         statusCode: String, version: Int,
         targetPrice: String?, specsJSON: String, modelId: String,
         modelBrand: String, modelName: String, latestSaleJSON: String?,
         gradeCode: String?, inspectionNotes: String?, updatedAt: String,
         modelImageUrl: String? = nil, modelCategoryId: String? = nil,
         pricesJSON: String? = nil) {
        self.id = id
        self.imei = imei
        self.imei2 = imei2
        self.serialNumber = serialNumber
        self.kindCode = kindCode
        self.statusCode = statusCode
        self.version = version
        self.targetPrice = targetPrice
        self.specsJSON = specsJSON
        self.modelId = modelId
        self.modelBrand = modelBrand
        self.modelName = modelName
        self.latestSaleJSON = latestSaleJSON
        self.gradeCode = gradeCode
        self.inspectionNotes = inspectionNotes
        self.updatedAt = updatedAt
        self.modelImageUrl = modelImageUrl
        self.modelCategoryId = modelCategoryId
        self.pricesJSON = pricesJSON
    }
}

/// Cached partner from `/sync/changes`. Money columns are Decimal strings.
@Model
final class PartnerEntity {
    @Attribute(.unique) var id: String
    var shopName: String
    var phone: String?
    var creditLimit: String
    var outstanding: String

    init(id: String, shopName: String, phone: String?,
         creditLimit: String, outstanding: String) {
        self.id = id
        self.shopName = shopName
        self.phone = phone
        self.creditLimit = creditLimit
        self.outstanding = outstanding
    }
}

/// Cached quantity product from `/sync/changes` `products[]` (ADR 0030), so an
/// offline till can find a barcode and sell pieces. `quantity` may be negative.
/// `salePrice` is a Decimal string (nil when unset). A new @Model type — an
/// existing store migrates by adding it (no data loss).
@Model
final class ProductEntity {
    @Attribute(.unique) var modelId: String
    var brand: String
    var name: String
    var barcode: String?
    var salePrice: String?
    var quantity: Int
    /// Picture path + category (ADR 0031) for the offline catalog grid. Optional
    /// so an existing cached row migrates without them.
    var imageUrl: String?
    var categoryId: String?
    /// Resolved list prices per level (ADR 0034) as a JSON object string. Optional
    /// so an existing cached row migrates without it.
    var pricesJSON: String?

    init(modelId: String, brand: String, name: String,
         barcode: String?, salePrice: String?, quantity: Int,
         imageUrl: String? = nil, categoryId: String? = nil,
         pricesJSON: String? = nil) {
        self.modelId = modelId
        self.brand = brand
        self.name = name
        self.barcode = barcode
        self.salePrice = salePrice
        self.quantity = quantity
        self.imageUrl = imageUrl
        self.categoryId = categoryId
        self.pricesJSON = pricesJSON
    }
}

/// Queued offline mutation awaiting `/sync/push`. Only the four server-
/// registered types are ever written here (see `OutboxType`).
/// `status`: pending | conflict | rejected.
@Model
final class OutboxEntry {
    @Attribute(.unique) var id: String   // client UUID, also the push mutation id
    var type: String
    var payloadJSON: String
    var baseVersion: Int?
    var occurredAt: String               // ISO-8601
    var status: String
    var lastError: String?
    var createdAt: Date
    var storeId: String?

    init(id: String, type: String, payloadJSON: String, baseVersion: Int?,
         occurredAt: String, status: String = "pending",
         lastError: String? = nil, createdAt: Date = Date(),
         storeId: String? = nil) {
        self.id = id
        self.type = type
        self.payloadJSON = payloadJSON
        self.baseVersion = baseVersion
        self.occurredAt = occurredAt
        self.status = status
        self.lastError = lastError
        self.createdAt = createdAt
        self.storeId = storeId
    }
}

/// Single-row-per-key scratchpad for sync bookkeeping (the `/sync/changes`
/// cursor lives here under `SyncMeta.cursorKey`).
@Model
final class SyncMeta {
    @Attribute(.unique) var key: String
    var value: String

    init(key: String, value: String) {
        self.key = key
        self.value = value
    }

    static let cursorKey = "changes_cursor"
}

/// The whole local schema, in one place for the `ModelContainer`.
enum LocalSchema {
    static let models: [any PersistentModel.Type] =
        [DeviceEntity.self, PartnerEntity.self, ProductEntity.self, OutboxEntry.self, SyncMeta.self]
}
