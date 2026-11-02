package uz.malika.erp.features.nasiya.data

import uz.malika.erp.AppContainer

/**
 * Slice-local wiring. Holds ONE [NasiyaApi] (one OkHttp client) for the whole
 * Nasiya group and builds its repositories/writer from the foundation
 * [AppContainer]. Keeps a second client from being spun up per ViewModel.
 */
object NasiyaModule {

    @Volatile
    private var apiRef: NasiyaApi? = null

    fun api(c: AppContainer): NasiyaApi =
        apiRef ?: synchronized(this) {
            apiRef ?: NasiyaApiFactory.build(c.devConfig, c.secure, c.authEvents).also { apiRef = it }
        }

    fun partnerRepository(c: AppContainer) = PartnerRepository(api(c))

    fun consignmentRepository(c: AppContainer) = ConsignmentRepository(api(c))

    fun consignmentWriter(c: AppContainer) =
        ConsignmentWriter(api(c), c.outbox, c.db, c.connectivity)
}
