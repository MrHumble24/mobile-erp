package uz.malika.erp.features.admin.model

import uz.malika.erp.features.admin.data.SettingsForm

/** Per-field validity (true = INVALID). Ranges mirror the server UpdateSettingsDto. */
data class SettingsErrors(
    val closingTime: Boolean,
    val defaultWarrantyDays: Boolean,
    val minMarginPercent: Boolean,
    val lowStockThreshold: Boolean,
    val defaultNasiyaDueDays: Boolean,
    val overdueReminderDays: Boolean,
    val bonusEarnPercent: Boolean,
    val bonusMaxRedeemPercent: Boolean,
) {
    val hasError: Boolean
        get() = closingTime || defaultWarrantyDays || minMarginPercent ||
            lowStockThreshold || defaultNasiyaDueDays || overdueReminderDays ||
            bonusEarnPercent || bonusMaxRedeemPercent
}

private val TIME_RE = Regex("^([01]\\d|2[0-3]):[0-5]\\d$")

private fun badInt(v: String, max: Int): Boolean {
    val n = v.trim().toIntOrNull() ?: return true
    return n < 0 || n > max
}

private fun badNum(v: String, max: Double): Boolean {
    val n = v.trim().toDoubleOrNull() ?: return true
    return n < 0 || n > max
}

/** A percent: a number from 0 to 100 with at most 2 decimals. */
private fun badPercent(v: String): Boolean {
    val trimmed = v.trim()
    if (!Regex("^-?\\d+(\\.\\d{1,2})?$").matches(trimmed)) return true
    val n = trimmed.toDoubleOrNull() ?: return true
    return n < 0 || n > 100
}

/** Pure validation of the settings form; UI blocks submit when [SettingsErrors.hasError]. */
fun validateSettings(form: SettingsForm): SettingsErrors = SettingsErrors(
    closingTime = !TIME_RE.matches(form.closingTime.trim()),
    defaultWarrantyDays = badInt(form.defaultWarrantyDays, 3650),
    minMarginPercent = badNum(form.minMarginPercent, 100.0),
    lowStockThreshold = badInt(form.lowStockThreshold, 1000),
    defaultNasiyaDueDays = badInt(form.defaultNasiyaDueDays, 3650),
    overdueReminderDays = badInt(form.overdueReminderDays, 365),
    // Percents are validated only while bonus is on; off, blank/invalid values are ignored.
    bonusEarnPercent = form.bonusEnabled && badPercent(form.bonusEarnPercent),
    bonusMaxRedeemPercent = form.bonusEnabled && badPercent(form.bonusMaxRedeemPercent),
)
