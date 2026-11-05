package uz.malika.erp.features.sales.lib

/**
 * The till posts one sale per cart line, but a trade-in belongs to one sale and
 * its value may not exceed that sale's price (ADR 0039). This allocates each
 * trade-in to a line that can carry it — largest trade-in first, onto the line
 * with the largest remaining price — so the payments sent for a line are its
 * price minus the trade-ins put on it. A trade-in that fits no single line makes
 * the whole plan `!ok`, and checkout must refuse before sending.
 *
 * All money is integer cents (Long) so nothing drifts through doubles, mirroring
 * the web `allocate-trade-ins.ts` / `trade-in-plan.ts`. Pure — unit-tested.
 */
object TradeInPlan {

    /** One cart line to pay: its final price in cents. */
    data class AllocLine(val lineId: String, val priceCents: Long)

    /** One trade-in draft: its agreed value in cents. */
    data class AllocItem(val id: String, val valueCents: Long)

    data class Allocation(
        val ok: Boolean,
        /** lineId → total trade-in value put on it (cents). */
        val valueByLine: Map<String, Long>,
        /** lineId → trade-in item ids put on it. */
        val itemsByLine: Map<String, List<String>>,
        /** The first trade-in no single line could carry; set only when `ok` is false. */
        val unplaceableId: String? = null,
    )

    data class Plan(
        /** False when a trade-in fits no single line; checkout must refuse. */
        val ok: Boolean,
        /** Σ trade-in values (cents). */
        val tradeInTotalCents: Long,
        /** Cart total − trade-ins: what the customer still tenders (cents). */
        val amountToPayCents: Long,
        /** Per line, its price minus the trade-ins put on it — the payment basis. */
        val payableLines: List<AllocLine>,
        /** lineId → trade-in item ids attached to that line. */
        val itemsByLine: Map<String, List<String>>,
        val unplaceableId: String? = null,
    )

    fun allocate(lines: List<AllocLine>, items: List<AllocItem>): Allocation {
        val remaining = lines.associate { it.lineId to it.priceCents }.toMutableMap()
        val valueByLine = HashMap<String, Long>()
        val itemsByLine = HashMap<String, MutableList<String>>()
        lines.forEach { itemsByLine[it.lineId] = mutableListOf() }

        // Largest trade-in first, so a big trade-in claims a big line before small ones.
        val ordered = items.sortedByDescending { it.valueCents }
        for (item in ordered) {
            var bestLine: String? = null
            var bestRemaining = -1L
            for ((lineId, rem) in remaining) {
                if (rem >= item.valueCents && rem > bestRemaining) {
                    bestLine = lineId
                    bestRemaining = rem
                }
            }
            if (bestLine == null) {
                return Allocation(ok = false, valueByLine = emptyMap(), itemsByLine = emptyMap(), unplaceableId = item.id)
            }
            remaining[bestLine] = bestRemaining - item.valueCents
            valueByLine[bestLine] = (valueByLine[bestLine] ?: 0L) + item.valueCents
            itemsByLine[bestLine]!!.add(item.id)
        }
        return Allocation(ok = true, valueByLine = valueByLine, itemsByLine = itemsByLine.mapValues { it.value.toList() })
    }

    fun plan(lines: List<AllocLine>, items: List<AllocItem>): Plan {
        val dueTotal = lines.sumOf { it.priceCents }
        val total = items.sumOf { it.valueCents }
        if (items.isEmpty()) {
            return Plan(ok = true, tradeInTotalCents = 0, amountToPayCents = dueTotal, payableLines = lines, itemsByLine = emptyMap())
        }
        val alloc = allocate(lines, items)
        if (!alloc.ok) {
            return Plan(
                ok = false,
                tradeInTotalCents = total,
                amountToPayCents = dueTotal - total,
                payableLines = lines,
                itemsByLine = emptyMap(),
                unplaceableId = alloc.unplaceableId,
            )
        }
        val payableLines = lines.map { AllocLine(it.lineId, it.priceCents - (alloc.valueByLine[it.lineId] ?: 0L)) }
        return Plan(
            ok = true,
            tradeInTotalCents = total,
            amountToPayCents = dueTotal - total,
            payableLines = payableLines,
            itemsByLine = alloc.itemsByLine,
        )
    }
}
