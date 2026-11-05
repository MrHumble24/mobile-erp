import SwiftUI
import SwiftData

/// Builds this slice's repositories, writer and view models from the app
/// container. Kept in the slice (an extension, no foundation edit) so views
/// stay declarative and nothing imports a concrete singleton.
extension AppContainer {
    var partnerRepository: PartnerRepository {
        PartnerRepository(api: api, context: modelContext)
    }
    var consignmentRepository: ConsignmentRepository {
        ConsignmentRepository(api: api)
    }
    var consignmentWriter: ConsignmentWriter {
        ConsignmentWriter(
            repo: consignmentRepository, context: modelContext,
            isOnline: { [connectivity] in connectivity.isOnline },
            syncNow: { [sync] in sync.syncNow() })
    }

    func makePartnersListModel() -> PartnersListModel {
        PartnersListModel(repo: partnerRepository,
                          isOnline: { [connectivity] in connectivity.isOnline })
    }
    func makePartnerDetailModel() -> PartnerDetailModel {
        PartnerDetailModel(repo: partnerRepository,
                           isOnline: { [connectivity] in connectivity.isOnline })
    }
    func makeConsignmentsListModel() -> ConsignmentsListModel {
        ConsignmentsListModel(repo: consignmentRepository, context: modelContext,
                              isOnline: { [connectivity] in connectivity.isOnline })
    }
    func makeConsignFormModel(partnerId: String?, lockPartner: Bool, initialCode: String? = nil) -> ConsignFormModel {
        let context = modelContext
        return ConsignFormModel(writer: consignmentWriter, partnerRepo: partnerRepository,
                         isOnline: { [connectivity] in connectivity.isOnline },
                         initialPartnerId: partnerId, lockPartner: lockPartner,
                         partnerPrice: { code in Self.cachedPartnerPrice(code, context: context) },
                         initialCode: initialCode)
    }

    /// The PARTNER list price for a unit code, read from the synced device cache
    /// (ADR 0034). Nil when the unit is not cached or has no partner price.
    private static func cachedPartnerPrice(_ code: String, context: ModelContext) -> Decimal? {
        let descriptor = FetchDescriptor<DeviceEntity>(
            predicate: #Predicate { $0.imei == code || $0.imei2 == code || $0.serialNumber == code })
        guard let d = try? context.fetch(descriptor).first else { return nil }
        return PriceLevelPrices.from(jsonString: d.pricesJSON).decimal(PriceLevels.partner)
    }
}
