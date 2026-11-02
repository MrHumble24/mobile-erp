package uz.malika.erp.core

/**
 * Build-time defaults. The server has NO global prefix and lives on :3000.
 * On the Android emulator the host machine is reachable at `10.0.2.2`; on a
 * real terminal use the server's LAN IP (set it in the dev panel).
 */
object Config {
    const val DEFAULT_API_URL = "http://10.0.2.2:3000"
}
