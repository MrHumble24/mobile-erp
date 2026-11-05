package uz.malika.erp.features.customs.data

import kotlinx.serialization.Serializable

/**
 * Transport shapes for the customs price-list API (ADR 0027). Money (`fee`,
 * `previousFee`) is a decimal string; `effectiveAt`/`createdAt` are ISO strings
 * (sliced to `yyyy-MM-dd` for display). Append-only on the server: the client
 * only ever reads versions and posts a new one.
 */

/** One row of the current list, with the prior version's fee for the same code. */
@Serializable
data class CurrentItemDto(
    val customsCode: String,
    val description: String? = null,
    val fee: String,
    /** The previous version's fee for this code, or null when the code is new. */
    val previousFee: String? = null,
    val usedByModel: Boolean = false,
)

/** The current (newest) list; the endpoint returns JSON `null` when none exists. */
@Serializable
data class CurrentListDto(
    val id: String,
    val effectiveAt: String,
    val note: String? = null,
    val items: List<CurrentItemDto> = emptyList(),
)

/** One version in the history list. */
@Serializable
data class PriceListVersionDto(
    val id: String,
    val effectiveAt: String,
    val note: String? = null,
    val createdById: String = "",
    val createdAt: String = "",
    val itemCount: Int = 0,
)

/** A model whose customs fee cannot be stamped from the current list. */
@Serializable
data class UnmatchedModelDto(
    val id: String,
    val brand: String,
    val name: String,
    val customsCode: String? = null,
    /** `MISSING_CODE` or `CODE_NOT_IN_CURRENT_LIST`. */
    val reason: String,
)

/** One point of a code's fee over time, oldest first, for the trend chart. */
@Serializable
data class FeeHistoryPointDto(
    val listId: String,
    val effectiveAt: String,
    val fee: String,
)

@Serializable
data class CreatePriceListBody(
    val effectiveAt: String? = null,
    val note: String? = null,
    val items: List<PriceListItemBody>,
)

@Serializable
data class PriceListItemBody(
    val customsCode: String,
    val description: String? = null,
    val fee: Double,
)
