package uz.malika.erp.shared.lib

/** The server's default list page size (`pageSize` in the list DTOs; max 200). */
const val DEFAULT_PAGE_SIZE = 50

/**
 * Accumulating pagination state for the server's `page`/`pageSize` lists (which
 * return `{ items, total, page, pageSize }`). Hold one per list in a ViewModel;
 * call [append] with each loaded page, read [hasMore] / [nextPage] to drive a
 * "load more" footer. Page 1 (or 0) resets; later pages concatenate.
 */
data class PageState<T>(
    val items: List<T> = emptyList(),
    val total: Int = 0,
    /** Highest page loaded (1-based); 0 = nothing loaded yet. */
    val page: Int = 0,
    val loading: Boolean = false,
) {
    val hasMore: Boolean get() = items.size < total
    val nextPage: Int get() = page + 1

    /** Merge a freshly loaded [loadedPage] in. Page ≤ 1 replaces; else appends. */
    fun append(pageItems: List<T>, total: Int, loadedPage: Int): PageState<T> =
        copy(
            items = if (loadedPage <= 1) pageItems else items + pageItems,
            total = total,
            page = loadedPage,
            loading = false,
        )
}
