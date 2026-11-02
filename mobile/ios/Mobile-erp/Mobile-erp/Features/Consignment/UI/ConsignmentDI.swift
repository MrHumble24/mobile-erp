import SwiftUI

/// Builds this slice's repositories, writer and view models from the app
/// container. Kept in the slice (an extension, no foundation edit) so views
/// stay declarative and nothing imports a concrete singleton.
extension AppContainer {
    var partnerRepository: PartnerRepository {
        PartnerRepository(api: api, context: modelContext,
                          baseURL: { [devConfig] in devConfig.baseURL })
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
    func makeConsignFormModel(partnerId: String?, lockPartner: Bool) -> ConsignFormModel {
        ConsignFormModel(writer: consignmentWriter, partnerRepo: partnerRepository,
                         isOnline: { [connectivity] in connectivity.isOnline },
                         initialPartnerId: partnerId, lockPartner: lockPartner)
    }
}
