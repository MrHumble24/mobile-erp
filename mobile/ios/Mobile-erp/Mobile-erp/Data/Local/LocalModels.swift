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

    /// The code to show the user: the IMEI when present, else the serial number.
    var unitCode: String { UnitCode.display(imei: imei, serialNumber: serialNumber) }

    init(id: String, imei: String?, imei2: String?, serialNumber: String?, kindCode: String?,
         statusCode: String, version: Int,
         targetPrice: String?, specsJSON: String, modelId: String,
         modelBrand: String, modelName: String, latestSaleJSON: String?,
         gradeCode: String?, inspectionNotes: String?, updatedAt: String) {
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

    init(modelId: String, brand: String, name: String,
         barcode: String?, salePrice: String?, quantity: Int) {
        self.modelId = modelId
        self.brand = brand
        self.name = name
        self.barcode = barcode
        self.salePrice = salePrice
        self.quantity = quantity
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

    init(id: String, type: String, payloadJSON: String, baseVersion: Int?,
         occurredAt: String, status: String = "pending",
         lastError: String? = nil, createdAt: Date = Date()) {
        self.id = id
        self.type = type
        self.payloadJSON = payloadJSON
        self.baseVersion = baseVersion
        self.occurredAt = occurredAt
        self.status = status
        self.lastError = lastError
        self.createdAt = createdAt
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
