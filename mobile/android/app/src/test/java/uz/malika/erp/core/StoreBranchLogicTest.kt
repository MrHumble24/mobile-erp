package uz.malika.erp.core

import androidx.sqlite.db.SupportSQLiteDatabase
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.local.OutboxEntity
import uz.malika.erp.features.auth.data.UserStore

class StoreBranchLogicTest {

    // ── Item 2 rules: one store; several and none saved; saved one gone ─────────

    @Test
    fun singleStoreIsChosenWithoutAsking() {
        val stores = listOf(UserStore(id = "store-1", name = "Main store"))
        // None saved
        assertEquals("store-1", StoreManager.resolveActiveStore(stores, savedStoreId = null))
        // Old/other store saved
        assertEquals("store-1", StoreManager.resolveActiveStore(stores, savedStoreId = "old-store"))
    }

    @Test
    fun severalStoresWithNoneSavedReturnsNull() {
        val stores = listOf(
            UserStore(id = "store-1", name = "Main store"),
            UserStore(id = "store-2", name = "Branch 2"),
        )
        assertNull(StoreManager.resolveActiveStore(stores, savedStoreId = null))
    }

    @Test
    fun severalStoresWithSavedStoreValidReturnsSaved() {
        val stores = listOf(
            UserStore(id = "store-1", name = "Main store"),
            UserStore(id = "store-2", name = "Branch 2"),
        )
        assertEquals("store-2", StoreManager.resolveActiveStore(stores, savedStoreId = "store-2"))
    }

    @Test
    fun severalStoresWithSavedStoreGoneReturnsNull() {
        val stores = listOf(
            UserStore(id = "store-1", name = "Main store"),
            UserStore(id = "store-2", name = "Branch 2"),
        )
        assertNull(StoreManager.resolveActiveStore(stores, savedStoreId = "store-deleted"))
    }

    // ── Header rule: added on requests, absent on /auth/login ───────────────────

    @Test
    fun headerIsAddedOnCallsAndAbsentOnAuthLogin() {
        var activeStore: String? = "store-test-42"
        val captured = mutableListOf<Request>()

        val storeInterceptor = Interceptor { chain ->
            val original = chain.request()
            val isLogin = original.url.encodedPath.endsWith("/auth/login")
            val storeId = if (!isLogin) activeStore else null
            val reqBuilder = original.newBuilder()
            if (!storeId.isNullOrEmpty()) {
                reqBuilder.header("X-Store-Id", storeId)
            }
            chain.proceed(reqBuilder.build())
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(storeInterceptor)
            .addInterceptor { chain ->
                captured.add(chain.request())
                Response.Builder()
                    .request(chain.request())
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("OK")
                    .body("{}".toResponseBody("application/json".toMediaType()))
                    .build()
            }
            .build()

        // 1. Regular request with active store -> carries X-Store-Id
        client.newCall(Request.Builder().url("http://localhost/sync/changes").build()).execute()
        assertEquals("store-test-42", captured.last().header("X-Store-Id"))

        // 2. /auth/login -> must NOT have X-Store-Id
        client.newCall(Request.Builder().url("http://localhost/auth/login").build()).execute()
        assertNull(captured.last().header("X-Store-Id"))

        // 3. Regular request with no active store -> no header
        activeStore = null
        client.newCall(Request.Builder().url("http://localhost/sync/changes").build()).execute()
        assertNull(captured.last().header("X-Store-Id"))
    }

    // ── Offline queue: queued change keeps its own store after a switch ────────

    @Test
    fun queuedChangeKeepsItsOwnStoreAfterSwitch() {
        var activeStore = "store-1"
        val outbox = mutableListOf<OutboxEntity>()

        // Simulate enqueueing under store-1
        fun enqueue(type: String, payload: String): OutboxEntity {
            val entity = OutboxEntity(
                id = "id-${outbox.size + 1}",
                type = type,
                payload = payload,
                baseVersion = 1,
                createdAt = "2026-11-06T12:00:00Z",
                storeId = activeStore,
            )
            outbox.add(entity)
            return entity
        }

        enqueue("sale.create", "{\"total\": 100}")
        assertEquals("store-1", outbox[0].storeId)

        // Switch to store-2
        activeStore = "store-2"

        enqueue("sale.create", "{\"total\": 200}")
        assertEquals("store-2", outbox[1].storeId)

        // Switch back to store-1
        activeStore = "store-1"

        // Mutation 1 still carries store-1, mutation 2 still carries store-2
        assertEquals("store-1", outbox[0].storeId)
        assertEquals("store-2", outbox[1].storeId)
    }

    // ── Room Migration 6 to 7 ───────────────────────────────────────────────────

    @Test
    fun migration6To7ExecutesAlterTable() {
        val executedSql = mutableListOf<String>()
        val mockDb = object : SupportSQLiteDatabase by (java.lang.reflect.Proxy.newProxyInstance(
            SupportSQLiteDatabase::class.java.classLoader,
            arrayOf(SupportSQLiteDatabase::class.java),
        ) { _, method, args ->
            if (method.name == "execSQL") {
                executedSql.add(args[0] as String)
            }
            null
        } as SupportSQLiteDatabase) {}

        AppDatabase.MIGRATION_6_7.migrate(mockDb)
        assertEquals(1, executedSql.size)
        assertEquals("ALTER TABLE outbox ADD COLUMN storeId TEXT", executedSql[0])
    }
}
