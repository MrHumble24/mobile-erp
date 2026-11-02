package uz.malika.erp

import android.app.Application

/** Owns the single [AppContainer] for the process lifetime. */
class MalikaApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
