package uz.malika.erp.features.shifts.data

import kotlinx.serialization.Serializable

/**
 * Cashier shifts (Change 11, ADR 0036). Transport shapes for `/shifts`. Every
 * figure the server computes (expected, difference, by-account/by-type groupings)
 * is a 2-dp string; nothing is stored or recomputed on the client. An open shift
 * has `closedAt`/`countedCash`/`difference` null and live figures.
 */

@Serializable
data class ShiftCashier(val id: String = "", val name: String = "")

@Serializable
data class ShiftAccountGroup(val accountCode: String = "", val `in`: String = "0", val out: String = "0", val net: String = "0")

@Serializable
data class ShiftTypeAccount(val accountCode: String = "", val count: Int = 0, val total: String = "0")

@Serializable
data class ShiftTypeGroup(
    val typeCode: String = "",
    val count: Int = 0,
    val total: String = "0",
    val byAccount: List<ShiftTypeAccount> = emptyList(),
)

@Serializable
data class ShiftReportView(
    val id: String = "",
    val cashier: ShiftCashier = ShiftCashier(),
    val openedAt: String = "",
    val closedAt: String? = null,
    val note: String? = null,
    val openingCount: String = "0",
    val expectedCash: String = "0",
    val countedCash: String? = null,
    val difference: String? = null,
    val cardTotal: String = "0",
    val byAccount: List<ShiftAccountGroup> = emptyList(),
    val byType: List<ShiftTypeGroup> = emptyList(),
) {
    val open: Boolean get() = closedAt == null
}

@Serializable
data class ShiftListItem(
    val id: String = "",
    val cashier: ShiftCashier = ShiftCashier(),
    val openedAt: String = "",
    val closedAt: String? = null,
    val openingCount: String = "0",
    val closingCount: String? = null,
    val difference: String? = null,
) {
    val open: Boolean get() = closedAt == null
}

@Serializable
data class ShiftListResult(
    val items: List<ShiftListItem> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
)

@Serializable
data class OpenShiftBody(val openingCount: Double)

@Serializable
data class CloseShiftBody(val closingCount: Double, val note: String? = null)

@Serializable
data class ForceCloseShiftBody(val closingCount: Double, val note: String)
