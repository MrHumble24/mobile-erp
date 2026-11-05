import Foundation

/// One source of truth for a unit's human code and how a scanned/typed code is
/// sent to the server (ADR 0029). A unit is identified by an IMEI (phones) OR a
/// serial number (consoles/laptops/watches), never both. Every display that used
/// to show an IMEI shows `display(...)`; every scan/search that used to assume an
/// IMEI classifies with `classify(...)` so a serial number rides in the right
/// request field (and the offline outbox carries whichever was scanned).
enum UnitCode {
    /// The code to show the user: the IMEI when present, else the serial number.
    static func display(imei: String?, serialNumber: String?) -> String {
        let i = (imei ?? "").trimmingCharacters(in: .whitespaces)
        if !i.isEmpty { return i }
        return (serialNumber ?? "").trimmingCharacters(in: .whitespaces)
    }

    /// A scanned or typed code, classified for a write body. A Luhn-valid 15-digit
    /// code is an IMEI; anything else is a serial number (trimmed, upper-cased).
    /// The server resolves either against imei/imei2/serialNumber alike, but a
    /// non-IMEI sent in the `imei` field would fail its 15-digit DTO check.
    enum Classified: Equatable {
        case imei(String)
        case serial(String)

        var imei: String? { if case let .imei(v) = self { return v } else { return nil } }
        var serialNumber: String? { if case let .serial(v) = self { return v } else { return nil } }
    }

    static func classify(_ raw: String) -> Classified {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if ScanText.isLuhnValid(trimmed) { return .imei(trimmed) }
        return .serial(trimmed.uppercased())
    }

    /// A serial number as the server stores it: trimmed, upper-cased.
    static func normalizeSerial(_ raw: String) -> String {
        raw.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    }

    /// Serial-number rule for intake entry (ADR 0029): 3–64 letters or digits,
    /// no spaces. Mirrors the server's `SERIAL_REGEX`.
    static func isValidSerial(_ raw: String) -> Bool {
        let s = normalizeSerial(raw)
        guard (3...64).contains(s.count) else { return false }
        return s.allSatisfy { $0.isASCII && ($0.isLetter || $0.isNumber) }
    }
}

#if DEBUG
func runUnitCodeSelfChecks() {
    assert(UnitCode.display(imei: "356938035643809", serialNumber: nil) == "356938035643809")
    assert(UnitCode.display(imei: nil, serialNumber: "sn-abc") == "sn-abc")
    assert(UnitCode.display(imei: "", serialNumber: "SN1") == "SN1")
    // 490154203237518 is Luhn-valid → IMEI; a serial is upper-cased.
    assert(UnitCode.classify("490154203237518") == .imei("490154203237518"))
    assert(UnitCode.classify(" ps5-abc ") == .serial("PS5-ABC"))
    assert(UnitCode.isValidSerial("ABC123"))
    assert(!UnitCode.isValidSerial("ab"))          // too short
    assert(!UnitCode.isValidSerial("AB C"))        // space
}
#endif
