import Foundation

/// Pure client-side validation, mirroring the server `UpdateSettingsDto`
/// validators so a bad value is caught before the request. Returns the set of
/// invalid field keys (empty = valid). The server is still the authority; this
/// is only a fast local guard.
enum SettingsValidation {
    static func invalidFields(_ v: SettingsValues) -> Set<String> {
        var bad = Set<String>()
        if v.storeName.count > 200 { bad.insert("storeName") }
        if v.storeAddress.count > 500 { bad.insert("storeAddress") }
        if v.storePhone.count > 50 { bad.insert("storePhone") }
        if v.receiptFooter.count > 500 { bad.insert("receiptFooter") }
        if v.telegramChatId.count > 100 { bad.insert("telegramChatId") }
        if !isClosingTime(v.closingTime) { bad.insert("closingTime") }
        if !isInt(v.defaultWarrantyDays, max: 3650) { bad.insert("defaultWarrantyDays") }
        if !isDecimal(v.minMarginPercent, max: 100) { bad.insert("minMarginPercent") }
        if !isInt(v.lowStockThreshold, max: 1000) { bad.insert("lowStockThreshold") }
        if !isInt(v.defaultNasiyaDueDays, max: 3650) { bad.insert("defaultNasiyaDueDays") }
        if !isInt(v.overdueReminderDays, max: 365) { bad.insert("overdueReminderDays") }
        if v.bonusEnabled {
            if !isPercent(v.bonusEarnPercent) { bad.insert("bonusEarnPercent") }
            if !isPercent(v.bonusMaxRedeemPercent) { bad.insert("bonusMaxRedeemPercent") }
        }
        return bad
    }

    static func isValid(_ v: SettingsValues) -> Bool { invalidFields(v).isEmpty }

    private static func isClosingTime(_ s: String) -> Bool {
        s.wholeMatch(of: /([01]\d|2[0-3]):[0-5]\d/) != nil
    }

    private static func isInt(_ s: String, max: Int) -> Bool {
        guard let n = Int(s) else { return false }
        return n >= 0 && n <= max
    }

    private static func isDecimal(_ s: String, max: Double) -> Bool {
        guard let n = Double(s) else { return false }
        return n >= 0 && n <= max
    }

    private static func isPercent(_ s: String) -> Bool {
        guard let n = Double(s) else { return false }
        if n < 0 || n > 100 { return false }
        if let dotIndex = s.firstIndex(of: ".") {
            let decimals = s[s.index(after: dotIndex)...]
            if decimals.count > 2 { return false }
        }
        return true
    }
}

#if DEBUG
/// Self-check for the range/format rules (no test target in the app). Runs once
/// when the Settings screen first binds, in DEBUG only.
func runSettingsSelfChecks() {
    var ok = SettingsValues()
    ok.closingTime = "20:30"
    ok.defaultWarrantyDays = "365"
    ok.minMarginPercent = "12.5"
    ok.lowStockThreshold = "3"
    ok.defaultNasiyaDueDays = "30"
    ok.overdueReminderDays = "7"
    assert(SettingsValidation.isValid(ok), "valid settings rejected")

    var bad = ok
    bad.closingTime = "24:00"          // out of range hour
    assert(SettingsValidation.invalidFields(bad).contains("closingTime"))

    bad = ok
    bad.minMarginPercent = "150"       // > 100
    assert(SettingsValidation.invalidFields(bad).contains("minMarginPercent"))

    bad = ok
    bad.defaultWarrantyDays = "4000"   // > 3650
    assert(SettingsValidation.invalidFields(bad).contains("defaultWarrantyDays"))

    bad = ok
    bad.overdueReminderDays = "x"      // not a number
    assert(SettingsValidation.invalidFields(bad).contains("overdueReminderDays"))

    // Bonus validation self-checks (ADR 0043)
    var bonusOk = ok
    bonusOk.bonusEnabled = true
    bonusOk.bonusEarnPercent = "5.5"
    bonusOk.bonusMaxRedeemPercent = "50"
    assert(SettingsValidation.isValid(bonusOk), "valid bonus settings rejected")

    var bonusBad = bonusOk
    bonusBad.bonusEarnPercent = "5.555"
    assert(SettingsValidation.invalidFields(bonusBad).contains("bonusEarnPercent"), "bonusEarnPercent >2 decimals allowed")

    bonusBad = bonusOk
    bonusBad.bonusMaxRedeemPercent = "101"
    assert(SettingsValidation.invalidFields(bonusBad).contains("bonusMaxRedeemPercent"), "bonusMaxRedeemPercent >100 allowed")

    bonusBad = bonusOk
    bonusBad.bonusEarnPercent = "-1"
    assert(SettingsValidation.invalidFields(bonusBad).contains("bonusEarnPercent"), "negative bonusEarnPercent allowed")

    bonusBad = bonusOk
    bonusBad.bonusEnabled = false
    bonusBad.bonusEarnPercent = "999"
    assert(SettingsValidation.isValid(bonusBad), "invalid bonus checked when bonus disabled")
}
#endif
