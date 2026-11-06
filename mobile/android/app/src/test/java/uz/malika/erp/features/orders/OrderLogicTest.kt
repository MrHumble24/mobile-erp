package uz.malika.erp.features.orders

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.orders.lib.OrderRules
import uz.malika.erp.features.orders.lib.OrderStatusAction
import uz.malika.erp.features.orders.lib.OrderTimeFormat
import uz.malika.erp.features.orders.lib.TimeAgoUnit

/** The two pure parts of the orders feature (handoff 029): which status buttons a
 *  status + permission set allows, and the "how long ago" bucketing. */
class OrderLogicTest {

    @Test
    fun newOrderOffersContactAndCancelWhenManageGranted() {
        assertEquals(
            listOf(OrderStatusAction.MARK_CONTACTED, OrderStatusAction.CANCEL),
            OrderRules.allowedActions(OrderRules.STATUS_NEW, canManage = true),
        )
    }

    @Test
    fun contactedOrderOffersDoneAndCancel() {
        assertEquals(
            listOf(OrderStatusAction.MARK_DONE, OrderStatusAction.CANCEL),
            OrderRules.allowedActions(OrderRules.STATUS_CONTACTED, canManage = true),
        )
    }

    @Test
    fun terminalStatusesOfferNothing() {
        assertTrue(OrderRules.allowedActions(OrderRules.STATUS_DONE, canManage = true).isEmpty())
        assertTrue(OrderRules.allowedActions(OrderRules.STATUS_CANCELLED, canManage = true).isEmpty())
    }

    @Test
    fun withoutManageThereAreNoButtons() {
        assertTrue(OrderRules.allowedActions(OrderRules.STATUS_NEW, canManage = false).isEmpty())
    }

    @Test
    fun targetStatusMapsEachAction() {
        assertEquals(OrderRules.STATUS_CONTACTED, OrderRules.targetStatus(OrderStatusAction.MARK_CONTACTED))
        assertEquals(OrderRules.STATUS_DONE, OrderRules.targetStatus(OrderStatusAction.MARK_DONE))
        assertEquals(OrderRules.STATUS_CANCELLED, OrderRules.targetStatus(OrderStatusAction.CANCEL))
    }

    private val now = 1_000_000_000_000L

    @Test
    fun timeAgoBucketsFromSecondsToDays() {
        assertEquals(TimeAgoUnit.JUST_NOW, OrderTimeFormat.computeTimeAgo(now - 30_000, now).unit)
        val minutes = OrderTimeFormat.computeTimeAgo(now - 5 * 60_000, now)
        assertEquals(TimeAgoUnit.MINUTES, minutes.unit)
        assertEquals(5L, minutes.value)
        val hours = OrderTimeFormat.computeTimeAgo(now - 3 * 3_600_000, now)
        assertEquals(TimeAgoUnit.HOURS, hours.unit)
        assertEquals(3L, hours.value)
        val days = OrderTimeFormat.computeTimeAgo(now - 2 * 86_400_000L, now)
        assertEquals(TimeAgoUnit.DAYS, days.unit)
        assertEquals(2L, days.value)
    }

    @Test
    fun futureTimestampsClampToJustNow() {
        assertEquals(TimeAgoUnit.JUST_NOW, OrderTimeFormat.computeTimeAgo(now + 60_000, now).unit)
    }
}
