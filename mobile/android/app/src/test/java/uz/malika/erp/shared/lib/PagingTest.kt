package uz.malika.erp.shared.lib

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Pagination accumulation used by QC queue/inspections and shipment devices. */
class PagingTest {

    @Test fun firstPageReplacesAndReportsMore() {
        val s = PageState<Int>().append(listOf(1, 2), total = 5, loadedPage = 1)
        assertEquals(listOf(1, 2), s.items)
        assertEquals(1, s.page)
        assertTrue(s.hasMore)
        assertEquals(2, s.nextPage)
        assertFalse(s.loading)
    }

    @Test fun laterPagesAppendUntilComplete() {
        val s = PageState<Int>()
            .append(listOf(1, 2), total = 4, loadedPage = 1)
            .append(listOf(3, 4), total = 4, loadedPage = 2)
        assertEquals(listOf(1, 2, 3, 4), s.items)
        assertFalse(s.hasMore)
    }

    @Test fun pageZeroOrOneResetsRatherThanDuplicates() {
        val s = PageState<Int>()
            .append(listOf(1, 2), total = 9, loadedPage = 1)
            .append(listOf(7, 8), total = 9, loadedPage = 1)
        assertEquals(listOf(7, 8), s.items)
    }
}
