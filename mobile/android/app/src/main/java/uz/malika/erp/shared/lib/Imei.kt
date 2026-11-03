package uz.malika.erp.shared.lib

/** Server rule (device DTOs): an IMEI is exactly 15 digits. */
private val IMEI = Regex("^\\d{15}$")

fun isImei(code: String): Boolean = IMEI.matches(code.trim())
