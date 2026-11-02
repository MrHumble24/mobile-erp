package uz.malika.erp.features.admin

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.malika.erp.features.admin.data.SettingsForm
import uz.malika.erp.features.admin.model.validateSettings

/**
 * Pure validation of the settings form — the ranges mirror the server
 * UpdateSettingsDto, so a drift here is a drift from the backend contract.
 */
class SettingsValidationTest {

    private fun form(
        closing: String = "20:00",
        warranty: String = "14",
        margin: String = "10",
        lowStock: String = "2",
        nasiya: String = "30",
        overdue: String = "3",
    ) = SettingsForm(
        storeName = "", storeAddress = "", storePhone = "", receiptFooter = "",
        telegramChatId = "", closingTime = closing, defaultWarrantyDays = warranty,
        minMarginPercent = margin, lowStockThreshold = lowStock,
        defaultNasiyaDueDays = nasiya, overdueReminderDays = overdue,
    )

    @Test
    fun acceptsValidForm() {
        assertFalse(validateSettings(form()).hasError)
    }

    @Test
    fun rejectsBadClosingTime() {
        assertTrue(validateSettings(form(closing = "9:5")).closingTime)
        assertTrue(validateSettings(form(closing = "24:00")).closingTime)
        assertFalse(validateSettings(form(closing = "00:00")).closingTime)
    }

    @Test
    fun rejectsOutOfRangeNumbers() {
        assertTrue(validateSettings(form(margin = "101")).minMarginPercent)
        assertTrue(validateSettings(form(margin = "-1")).minMarginPercent)
        assertTrue(validateSettings(form(overdue = "366")).overdueReminderDays)
        assertTrue(validateSettings(form(warranty = "abc")).defaultWarrantyDays)
    }

    @Test
    fun acceptsDecimalMargin() {
        assertFalse(validateSettings(form(margin = "12.5")).minMarginPercent)
    }
}
