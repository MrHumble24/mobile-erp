package uz.malika.erp.features.sales

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.data.local.DeviceEntity
import uz.malika.erp.data.local.ProductEntity
import uz.malika.erp.features.sales.data.CatalogCard
import uz.malika.erp.features.sales.data.CatalogUnitItem
import uz.malika.erp.features.sales.lib.CardTap
import uz.malika.erp.features.sales.lib.OfflineCatalog
import uz.malika.erp.features.sales.lib.resolveCardTap

/** Catalog tap rules (ADR 0031) and the offline grid builder. */
class CatalogLogicTest {

    private fun unitCard(kind: String = "IMEI") = CatalogCard(
        modelId = "m1", brand = "Apple", name = "iPhone 15", kindCode = kind,
        categoryId = null, categoryName = null, imageUrl = null,
        inStock = 2, minTargetPrice = "100", maxTargetPrice = "150", salePrice = null,
    )

    private fun quantityCard() = CatalogCard(
        modelId = "q1", brand = "Generic", name = "Case", kindCode = "QUANTITY",
        categoryId = null, categoryName = null, imageUrl = null,
        inStock = 10, minTargetPrice = null, maxTargetPrice = null, salePrice = "20",
    )

    private fun unit(code: String) =
        CatalogUnitItem(id = code, code = code, specs = emptyMap(), gradeCode = null, targetPrice = "120")

    @Test
    fun quantityProductAddsStraightToCart() {
        assertEquals(CardTap.AddQuantity, resolveCardTap(quantityCard(), emptyList(), emptySet()))
    }

    @Test
    fun oneUnitLeftIsAddedDirectly() {
        val u = unit("111111111111111")
        val tap = resolveCardTap(unitCard(), listOf(u), emptySet())
        assertTrue(tap is CardTap.AddUnit && tap.unit == u)
    }

    @Test
    fun severalUnitsOpenThePicker() {
        val units = listOf(unit("111111111111111"), unit("222222222222222"))
        val tap = resolveCardTap(unitCard(), units, emptySet())
        assertTrue(tap is CardTap.PickUnit && tap.units.size == 2)
    }

    @Test
    fun aUnitAlreadyInTheCartIsNotOfferedAgain() {
        val a = unit("111111111111111")
        val b = unit("222222222222222")
        // b is in the cart → only a remains → it is added directly, not picked.
        val tap = resolveCardTap(unitCard(), listOf(a, b), setOf("222222222222222"))
        assertTrue(tap is CardTap.AddUnit && tap.unit == a)
        // both in the cart → nothing left to sell.
        val none = resolveCardTap(unitCard(), listOf(a, b), setOf(a.code, b.code))
        assertEquals(CardTap.NoneAvailable, none)
    }

    // ── Offline grid ───────────────────────────────────────────────────────────

    private fun device(id: String, status: String, modelId: String, brand: String, name: String, price: String?) =
        DeviceEntity(
            id = id, imei = id, statusCode = status, version = 1, targetPrice = price,
            modelId = modelId, modelBrand = brand, modelName = name,
            latestSale = null, gradeCode = null, inspectionNotes = null, updatedAt = "2026-11-05",
        )

    @Test
    fun offlineGridGroupsInStockUnitsAndIncludesQuantityProducts() {
        val devices = listOf(
            device("1", "IN_STOCK", "mA", "Apple", "iPhone 15", "100"),
            device("2", "IN_STOCK", "mA", "Apple", "iPhone 15", "150"),
            device("3", "SOLD", "mA", "Apple", "iPhone 15", "999"), // excluded (not sellable)
            device("4", "IN_STOCK", "mB", "Samsung", "A54", "80"),
        )
        val products = listOf(
            ProductEntity(modelId = "q1", brand = "Generic", name = "Cable", quantity = 42, salePrice = "15"),
        )
        val cards = OfflineCatalog.build(devices, products, categoryId = null, search = "")

        val a = cards.first { it.modelId == "mA" }
        assertEquals(2, a.inStock) // the SOLD unit dropped out
        assertEquals("100", a.minTargetPrice)
        assertEquals("150", a.maxTargetPrice)

        val q = cards.first { it.modelId == "q1" }
        assertEquals("QUANTITY", q.kindCode)
        assertEquals(42, q.inStock)
        assertEquals("15", q.salePrice)

        // Three products in all (mA, mB, q1); sorted by brand then name → Apple first.
        assertEquals(3, cards.size)
        assertEquals("mA", cards.first().modelId)
    }

    @Test
    fun offlineGridFiltersBySearchAndCategory() {
        val devices = listOf(
            device("1", "IN_STOCK", "mA", "Apple", "iPhone 15", "100").copy(categoryId = "cat-phone"),
            device("4", "IN_STOCK", "mB", "Samsung", "A54", "80").copy(categoryId = "cat-phone"),
        )
        val bySearch = OfflineCatalog.build(devices, emptyList(), categoryId = null, search = "samsung")
        assertEquals(listOf("mB"), bySearch.map { it.modelId })

        val byCategory = OfflineCatalog.build(devices, emptyList(), categoryId = "cat-phone", search = "")
        assertEquals(2, byCategory.size)
        val byOther = OfflineCatalog.build(devices, emptyList(), categoryId = "cat-none", search = "")
        assertTrue(byOther.isEmpty())
    }
}
