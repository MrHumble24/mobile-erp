package uz.malika.erp.features.sales.data

import kotlinx.coroutines.flow.first
import uz.malika.erp.core.runApi
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.local.CategoryEntity
import uz.malika.erp.features.sales.lib.OfflineCatalog

/**
 * Till catalog data access (ADR 0031): the product grid, a product's in-stock
 * units, and the category chips. Online reads `/catalog`; offline builds the
 * same grid from the Room cache ([OfflineCatalog]). Category names are cached on
 * each online fetch so the offline grid keeps its chips (ADR 0034).
 */
class TillCatalogRepository(
    private val api: TillCatalogApi,
    private val db: AppDatabase,
) {
    suspend fun cards(categoryId: String?, search: String, online: Boolean): List<CatalogCard> {
        if (online) {
            val query = buildMap {
                categoryId?.let { put("categoryId", it) }
                search.trim().takeIf { it.isNotEmpty() }?.let { put("search", it) }
            }
            return runApi { api.catalog(query).map(CatalogCard::fromDto) }
        }
        return OfflineCatalog.build(
            devices = db.deviceDao().watchAll().first(),
            products = db.productDao().watchAll().first(),
            categoryNames = db.categoryDao().all().associate { it.id to it.name },
            categoryId = categoryId,
            search = search,
        )
    }

    suspend fun units(modelId: String, online: Boolean): List<CatalogUnitItem> {
        if (online) return runApi { api.units(modelId).map(CatalogUnitItem::fromDto) }
        return OfflineCatalog.units(db.deviceDao().watchAll().first(), modelId)
    }

    /** Category chips. Online: fetch + cache; offline: the cached names (ADR 0034). */
    suspend fun categories(online: Boolean): List<CatalogCategoryDto> {
        if (online) {
            val cats = runApi { api.categories() }
            runCatching { db.categoryDao().upsertAll(cats.map { CategoryEntity(it.id, it.name) }) }
            return cats
        }
        return db.categoryDao().all().map { CatalogCategoryDto(it.id, it.name) }
    }
}
