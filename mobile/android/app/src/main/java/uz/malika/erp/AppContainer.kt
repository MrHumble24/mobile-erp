package uz.malika.erp

import android.content.Context
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.local.AppDatabase
import uz.malika.erp.data.remote.ApiService
import uz.malika.erp.data.remote.HttpClient
import uz.malika.erp.data.sync.ConflictStore
import uz.malika.erp.data.sync.Connectivity
import uz.malika.erp.data.sync.OutboxApi
import uz.malika.erp.data.sync.PullService
import uz.malika.erp.data.sync.PushService
import uz.malika.erp.data.sync.SyncManager
import uz.malika.erp.data.sync.TerminalId
import uz.malika.erp.features.auth.data.AuthRepository
import uz.malika.erp.features.auth.model.SessionViewModel
import uz.malika.erp.i18n.I18n
import uz.malika.erp.i18n.LocaleStore

/**
 * Manual dependency container (no Hilt). One instance, created in the
 * Application and held for the process lifetime. Wires every singleton; feature
 * slices receive it through their `FeatureModule.register` and build their own
 * repositories/ViewModels from its pieces.
 */
class AppContainer(context: Context) {

    val appScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val json = HttpClient.json
    val secure = SecureStore(context)
    val devConfig = DevConfigStore(secure)
    val authEvents = AuthEvents()

    /** The one configured Retrofit; slices call `retrofit.create(FeatureApi::class.java)`. */
    val retrofit = HttpClient.build(devConfig, secure, authEvents)
    val api = retrofit.create(ApiService::class.java)
    val db = AppDatabase.build(context)

    val terminalId = TerminalId(secure)
    val connectivity = Connectivity(context, appScope)

    private val pull = PullService(api, db)
    private val push = PushService(api, db, terminalId, json)
    val syncManager = SyncManager(appScope, connectivity, push, pull, secure)

    val outbox = OutboxApi(db, trigger = { syncManager.syncNow() })
    val conflicts = ConflictStore(api)

    val authRepository = AuthRepository(api, secure, json)

    val i18n = I18n.load(context.assets)
    val localeStore = LocaleStore(secure)

    /** Builds app-scoped ViewModels. Feature ViewModels can follow this pattern. */
    val viewModelFactory: ViewModelProvider.Factory = viewModelFactory {
        initializer { SessionViewModel(authRepository, authEvents, syncManager) }
    }
}
