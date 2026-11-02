package uz.malika.erp.core

/**
 * Build-time URL defaults, defined once. The server has NO global prefix.
 *  - Production is the deployed API.
 *  - Staging has no server yet → empty; the console blocks it until a URL is set.
 *  - Development is derived at runtime (emulator host vs. the build machine's LAN
 *    IP from `BuildConfig.DEV_HOST`) on port [DEV_PORT]; see [DevHost].
 * Any environment's URL can be overridden in the Developer Console.
 */
object Config {
    const val PROD_URL = "https://mobile-api.abdulboriy.dev"
    const val STAGING_URL = "" // no staging server yet
    const val DEV_PORT = 3000 // server `PORT ?? 3000`
}
