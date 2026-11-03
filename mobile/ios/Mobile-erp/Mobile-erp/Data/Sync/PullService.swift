import Foundation
import SwiftData

/// Drains `GET /sync/changes` into SwiftData. Pages from the stored cursor
/// until `nextSince` is null, upserting devices + partners and saving the
/// cursor after each page (so a crash mid-pull resumes, not restarts).
@MainActor
struct PullService {
    let api: APIClient
    let context: ModelContext

    func pull() async throws {
        var since = cursor()
        for _ in 0..<1000 {   // guard a server that never advances the cursor
            let json = try await api.getJSON(
                "/sync/changes", query: since.map { ["since": $0] } ?? [:]
            )
            let page = ChangesPage(json: json)
            AppLog.info("sync", "pull page: \(page.devices.count) devices, \(page.partners.count) partners")
            for d in page.devices { upsertDevice(d) }
            for p in page.partners { upsertPartner(p) }
            if let next = page.nextSince { setCursor(next) }
            try? context.save()
            guard let next = page.nextSince else { break }
            since = next
        }
    }

    private func upsertDevice(_ r: DeviceRow) {
        let id = r.id
        let existing = try? context.fetch(
            FetchDescriptor<DeviceEntity>(predicate: #Predicate { $0.id == id })
        ).first
        if let e = existing {
            e.imei = r.imei; e.imei2 = r.imei2; e.statusCode = r.statusCode; e.version = r.version
            e.targetPrice = r.targetPrice; e.specsJSON = r.specsJSON
            e.modelId = r.modelId; e.modelBrand = r.modelBrand; e.modelName = r.modelName
            e.latestSaleJSON = r.latestSaleJSON; e.gradeCode = r.gradeCode
            e.inspectionNotes = r.inspectionNotes; e.updatedAt = r.updatedAt
        } else {
            context.insert(DeviceEntity(
                id: r.id, imei: r.imei, imei2: r.imei2, statusCode: r.statusCode, version: r.version,
                targetPrice: r.targetPrice, specsJSON: r.specsJSON, modelId: r.modelId,
                modelBrand: r.modelBrand, modelName: r.modelName,
                latestSaleJSON: r.latestSaleJSON, gradeCode: r.gradeCode,
                inspectionNotes: r.inspectionNotes, updatedAt: r.updatedAt))
        }
    }

    private func upsertPartner(_ r: PartnerRow) {
        let id = r.id
        let existing = try? context.fetch(
            FetchDescriptor<PartnerEntity>(predicate: #Predicate { $0.id == id })
        ).first
        if let e = existing {
            e.shopName = r.shopName; e.phone = r.phone
            e.creditLimit = r.creditLimit; e.outstanding = r.outstanding
        } else {
            context.insert(PartnerEntity(
                id: r.id, shopName: r.shopName, phone: r.phone,
                creditLimit: r.creditLimit, outstanding: r.outstanding))
        }
    }

    private func cursor() -> String? {
        let key = SyncMeta.cursorKey
        return try? context.fetch(FetchDescriptor<SyncMeta>(
            predicate: #Predicate { $0.key == key })).first?.value
    }

    private func setCursor(_ value: String) {
        let key = SyncMeta.cursorKey
        if let row = try? context.fetch(FetchDescriptor<SyncMeta>(
            predicate: #Predicate { $0.key == key })).first {
            row.value = value
        } else {
            context.insert(SyncMeta(key: key, value: value))
        }
    }
}
