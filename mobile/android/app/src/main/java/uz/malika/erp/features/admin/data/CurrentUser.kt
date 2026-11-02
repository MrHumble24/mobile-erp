package uz.malika.erp.features.admin.data

import org.json.JSONObject
import uz.malika.erp.AppContainer
import uz.malika.erp.core.SecureStore

/**
 * The signed-in user's id, read straight from the persisted session blob. This
 * is a deliberate tiny duplicate read (the auth slice is off-limits to import)
 * used only for the self-lock guards: an admin may not deactivate, re-role or
 * re-permission their own account and lock themselves out.
 */
fun currentUserId(container: AppContainer): String? {
    val raw = container.secure.get(SecureStore.Keys.USER) ?: return null
    return runCatching { JSONObject(raw).optString("id").ifBlank { null } }.getOrNull()
}
