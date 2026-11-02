package uz.malika.erp.core

import android.util.Base64
import org.json.JSONObject

/**
 * True when [token] is a JWT whose `exp` claim is already in the past, or is
 * malformed enough that it can't be trusted. Used by session restore so an
 * expired 12h token isn't treated as a live offline session. A token with no
 * `exp` claim is treated as non-expiring (the server always sets one).
 */
fun isJwtExpired(token: String, nowMillis: Long = System.currentTimeMillis()): Boolean {
    val parts = token.split(".")
    if (parts.size != 3) return true
    return try {
        val payloadJson = String(Base64.decode(parts[1], Base64.URL_SAFE or Base64.NO_WRAP))
        val payload = JSONObject(payloadJson)
        if (!payload.has("exp")) return false // no expiry claim → non-expiring
        val expMillis = payload.getLong("exp") * 1000L
        nowMillis > expMillis
    } catch (_: Exception) {
        true
    }
}
