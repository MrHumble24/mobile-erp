package uz.malika.erp.features.credit.data

import kotlinx.serialization.Serializable

/**
 * Customer credit, no interest (ADR 0035). Transport shapes for `/credits`. All
 * money is a 2-dp decimal string on reads; nothing derivable (agreedTotal, paid,
 * outstanding, overdue) is stored — the server computes it. There is deliberately
 * no interest/late-fee/penalty field anywhere. These DTOs double as read models.
 */

@Serializable
data class CreditCustomerRef(val id: String = "", val name: String = "", val phone: String? = null)

@Serializable
data class CreditPersonRef(val id: String = "", val name: String = "")

@Serializable
data class CreditSaleView(
    val saleId: String = "",
    val imei: String? = null,
    val serialNumber: String? = null,
    val model: String = "",
    val quantity: Int? = null,
    val salePrice: String = "0",
    val returnedAt: String? = null,
)

@Serializable
data class CreditInstalmentView(
    val id: String = "",
    val dueDate: String = "",
    val amount: String = "0",
    val paid: String = "0",
    val overdue: Boolean = false,
)

@Serializable
data class CreditPaymentView(
    val id: String = "",
    val accountCode: String = "",
    val amount: String = "0",
    val occurredAt: String = "",
    val receivedBy: CreditPersonRef = CreditPersonRef(),
)

@Serializable
data class CreditView(
    val id: String = "",
    val customer: CreditCustomerRef = CreditCustomerRef(),
    val createdBy: CreditPersonRef = CreditPersonRef(),
    val note: String? = null,
    val createdAt: String = "",
    val sales: List<CreditSaleView> = emptyList(),
    val instalments: List<CreditInstalmentView> = emptyList(),
    val payments: List<CreditPaymentView> = emptyList(),
    /** ADR 0068: cash price + one disclosed margin = the fixed agreed price. */
    val cashPrice: String = "0",
    val markupAmount: String = "0",
    val agreedTotal: String = "0",
    val paid: String = "0",
    val outstanding: String = "0",
    val overpaid: String = "0",
    val overdueAmount: String = "0",
    val settled: Boolean = false,
)

@Serializable
data class CreditListItem(
    val id: String = "",
    val customer: CreditCustomerRef = CreditCustomerRef(),
    val createdAt: String = "",
    val agreedTotal: String = "0",
    val paid: String = "0",
    val outstanding: String = "0",
    val overdueAmount: String = "0",
    val settled: Boolean = false,
)

@Serializable
data class CreditReportCustomer(
    val customerId: String = "",
    val name: String = "",
    val phone: String? = null,
    val outstanding: String = "0",
    val overdueAmount: String = "0",
)

@Serializable
data class CreditReport(
    val totalOutstanding: String = "0",
    val totalOverdue: String = "0",
    val customers: List<CreditReportCustomer> = emptyList(),
)

@Serializable
data class CreditContractGood(
    val description: String = "",
    val imei: String? = null,
    val serialNumber: String? = null,
    val quantity: Int? = null,
    val price: String = "0",
)

@Serializable
data class CreditContractStore(val name: String? = null, val address: String? = null, val phone: String? = null)

@Serializable
data class CreditContractInstalment(val dueDate: String = "", val amount: String = "0")

@Serializable
data class CreditContract(
    val creditId: String = "",
    val createdAt: String = "",
    val store: CreditContractStore = CreditContractStore(),
    val customer: CreditCustomerRef = CreditCustomerRef(),
    val goods: List<CreditContractGood> = emptyList(),
    /** ADR 0068: the disclosed cash-price / margin breakdown. */
    val cashPrice: String = "0",
    val markupAmount: String = "0",
    val agreedTotal: String = "0",
    val downPayment: String = "0",
    val instalments: List<CreditContractInstalment> = emptyList(),
    val terms: String = "",
)

/** A later payment on a credit, or an overpayment refund. `amount` positive. */
@Serializable
data class CreditPaymentBody(val amount: Double, val accountCode: String)

/** The list filter status, matching the server query. */
enum class CreditStatus(val query: String?, val labelKey: String) {
    ALL(null, "credit.allCredits"),
    OPEN("open", "credit.open"),
    OVERDUE("overdue", "credit.overdue"),
    SETTLED("settled", "credit.settled"),
}
