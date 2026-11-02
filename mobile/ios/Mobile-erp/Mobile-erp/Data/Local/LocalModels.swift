import Foundation
import SwiftData

/// Cached device from `/sync/changes`. Cost fields are intentionally absent —
/// the server redacts them from the feed for under-privileged users, so they
/// are never part of the offline cache. JSON blobs are stored as text.
@Model
final class DeviceEntity {
    @Attribute(.unique) var id: String
    var imei: String
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

    init(id: String, imei: String, statusCode: String, version: Int,
         targetPrice: String?, specsJSON: String, modelId: String,
         modelBrand: String, modelName: String, latestSaleJSON: String?,
         gradeCode: String?, inspectionNotes: String?, updatedAt: String) {
        self.id = id
        self.imei = imei
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
        [DeviceEntity.self, PartnerEntity.self, OutboxEntry.self, SyncMeta.self]
}
