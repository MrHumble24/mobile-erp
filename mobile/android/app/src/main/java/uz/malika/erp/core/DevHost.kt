package uz.malika.erp.core

import android.os.Build
import uz.malika.erp.BuildConfig

/** Where the auto-detected Development host came from, shown in the console. */
enum class HostSource {
    EMULATOR, // 10.0.2.2 (host loopback from the Android emulator)
    AUTO_BUILD_MACHINE, // the build machine's LAN IP baked into BuildConfig.DEV_HOST
}

/**
 * Resolves the Development base URL without anyone typing an IP:
 *  - on an emulator the host machine is `10.0.2.2`,
 *  - on a real device it is the build machine's LAN IP (`BuildConfig.DEV_HOST`).
 * The pure helpers ([isEmulator], [resolveHost], [devUrl]) are unit-tested; the
 * zero-arg accessors read `android.os.Build` / `BuildConfig` on device.
 */
object DevHost {

    /** Heuristic emulator detection from build identifiers (Build.FINGERPRINT etc.). */
    fun isEmulator(
        fingerprint: String,
        model: String,
        product: String,
        hardware: String,
    ): Boolean {
        val f = fingerprint.lowercase()
        val m = model.lowercase()
        val p = product.lowercase()
        val h = hardware.lowercase()
        return f.startsWith("generic") || f.contains("emulator") || f.contains("vbox") ||
            m.contains("emulator") || m.contains("sdk_gphone") || m.contains("android sdk") ||
            p.contains("sdk") || p.contains("emulator") || p.contains("sdk_gphone") ||
            h.contains("goldfish") || h.contains("ranchu")
    }

    fun resolveHost(isEmulator: Boolean, buildHost: String): String =
        if (isEmulator) "10.0.2.2" else buildHost

    fun devUrl(host: String, port: Int): String = "http://$host:$port"

    private fun emulatorNow(): Boolean =
        isEmulator(Build.FINGERPRINT, Build.MODEL, Build.PRODUCT, Build.HARDWARE)

    /** The source of the auto host, for display ("emulator" vs "build machine"). */
    fun source(): HostSource = if (emulatorNow()) HostSource.EMULATOR else HostSource.AUTO_BUILD_MACHINE

    /** The auto-detected host string (`10.0.2.2` or the LAN IP). */
    fun host(): String = resolveHost(emulatorNow(), BuildConfig.DEV_HOST)

    /** The full auto Development URL. */
    fun autoDevUrl(): String = devUrl(host(), Config.DEV_PORT)
}
