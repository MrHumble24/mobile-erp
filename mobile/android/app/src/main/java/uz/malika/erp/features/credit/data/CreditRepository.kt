package uz.malika.erp.features.credit.data

import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.runApi

/** The only place that talks to `/credits`. Every call is online (ADR 0035). */
class CreditRepository(private val api: CreditApi) {

    suspend fun list(customerId: String?, status: CreditStatus): List<CreditListItem> =
        runApi { api.list(customerId, status.query) }

    suspend fun get(id: String): CreditView = runApi { api.get(id) }

    suspend fun contract(id: String): CreditContract = runApi { api.contract(id) }

    suspend fun report(): CreditReport = runApi { api.report() }

    suspend fun create(body: JsonObject): CreditView = runApi { api.create(body) }

    suspend fun addPayment(id: String, amount: Double, accountCode: String): CreditView =
        runApi { api.addPayment(id, CreditPaymentBody(amount, accountCode)) }

    suspend fun refund(id: String, amount: Double, accountCode: String): CreditView =
        runApi { api.refund(id, CreditPaymentBody(amount, accountCode)) }
}
