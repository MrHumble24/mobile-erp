package uz.malika.erp.features.inventory

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.features.inventory.data.DeviceListItem
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.inventory.data.decodeSpecs
import uz.malika.erp.features.inventory.data.inventoryMargin
import uz.malika.erp.features.inventory.model.DeviceFilter
import uz.malika.erp.features.inventory.model.DeviceMetrics

/** Pure-logic checks for the inventory slice (no Android framework needed). */
class InventoryLogicTest {

    private fun entity(id: String, imei: String, status: String, modelId: String, specs: String = "{}") =
        DeviceEntity(
            id = id, imei = imei, statusCode = status, version = 1, targetPrice = null,
            specs = specs, modelId = modelId, modelBrand = "Apple", modelName = "iPhone 15",
            latestSale = null, gradeCode = null, inspectionNotes = null, updatedAt = "",
        )

    @Test fun marginIsTargetMinusCostWithPercentOfCost() {
        val m = inventoryMargin("1200", "1000")
        assertEquals(0, m.amount.compareTo(java.math.BigDecimal("200")))
        assertEquals(20, m.percent.toInt())
        assertTrue(m.positive)
    }

    @Test fun marginGoesNegativeAndPercentZeroWhenNoCost() {
        assertFalse(inventoryMargin("800", "1000").positive)
        assertEquals(0, inventoryMargin("800", "0").percent.toInt())
    }

    @Test fun decodeSpecsReadsScalarsAndToleratesGarbage() {
        val specs = decodeSpecs("""{"storage":"256GB","ram":8}""")
        assertEquals("256GB", specs["storage"])
        assertEquals("8", specs["ram"])
        assertTrue(decodeSpecs("not json").isEmpty())
    }

    @Test fun filterNarrowsByStatusModelStorageAndSearch() {
        val list = listOf(
            DeviceListItem.fromEntity(entity("1", "350001", "IN_STOCK", "m1", """{"storage":"128GB"}""")),
            DeviceListItem.fromEntity(entity("2", "350002", "DEFECTIVE", "m2", """{"storage":"256GB"}""")),
        )
        assertEquals(1, DeviceFilter(statusCode = "IN_STOCK").apply(list).size)
        assertEquals(1, DeviceFilter(modelId = "m2").apply(list).size)
        assertEquals(1, DeviceFilter(storage = "256GB").apply(list).size)
        assertEquals(1, DeviceFilter(search = "0001").apply(list).size)
        assertEquals(2, DeviceFilter().apply(list).size)
    }

    @Test fun metricsCountEachStatus() {
        val list = listOf(
            DeviceListItem.fromEntity(entity("1", "a", "IN_STOCK", "m")),
            DeviceListItem.fromEntity(entity("2", "b", "IN_STOCK", "m")),
            DeviceListItem.fromEntity(entity("3", "c", "DEFECTIVE", "m")),
            DeviceListItem.fromEntity(entity("4", "d", "CONSIGNED", "m")),
        )
        val metrics = DeviceMetrics.from(list)
        assertEquals(4, metrics.total)
        assertEquals(2, metrics.inStock)
        assertEquals(1, metrics.defective)
        assertEquals(1, metrics.consigned)
    }

    @Test fun manualTransitionsExcludeConsignAndSell() {
        assertEquals(listOf("DEFECTIVE"), DeviceStatusMeta.transitionsFor("IN_STOCK"))
        assertEquals(listOf("IN_STOCK"), DeviceStatusMeta.transitionsFor("DEFECTIVE"))
        assertTrue(DeviceStatusMeta.transitionsFor("CONSIGNED").isEmpty())
    }
}
