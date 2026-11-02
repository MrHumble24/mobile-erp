package uz.malika.erp.features.finance.model

import androidx.lifecycle.ViewModel
import uz.malika.erp.AppContainer
import uz.malika.erp.features.finance.data.FinanceApi
import uz.malika.erp.features.finance.data.FinanceReads

/**
 * Thin read-only ViewModel shared by the reports tabs and the dashboard
 * sections: it exposes the suspend reads the screens call inside `rememberAsync`
 * (which owns loading/error state and retry). No mutable state of its own.
 */
class FinanceReadsViewModel(container: AppContainer) : ViewModel() {

    private val reads = FinanceReads(container.retrofit.create(FinanceApi::class.java))

    suspend fun profit(from: String?, to: String?) = reads.profit(from, to)

    suspend fun expenseReport(from: String?, to: String?, groupBy: String) =
        reads.expenseReport(from, to, groupBy)

    suspend fun modelPricing() = reads.modelPricing()

    suspend fun dailyClosing(date: String?) = reads.dailyClosing(date)

    suspend fun lowStock() = reads.lowStock()

    suspend fun overdue() = reads.overdue()

    suspend fun deviceModelLabels() = reads.deviceModelLabels()
}
