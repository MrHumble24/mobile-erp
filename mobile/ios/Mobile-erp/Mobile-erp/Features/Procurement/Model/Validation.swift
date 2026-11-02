import Foundation

/// IMEI rule, shared by intake scanning and QC lookup. An IMEI is exactly 15
/// ASCII digits (the server rejects anything else). Duplicate prevention is the
/// caller's job (the intake draft set).
enum Imei {
    static func isValid(_ raw: String) -> Bool {
        let s = raw.trimmingCharacters(in: .whitespaces)
        return s.count == 15 && s.allSatisfy { $0.isASCII && $0.isNumber }
    }
}

/// Lookup `code` rule (grades / defect types): an upper-snake identifier, e.g.
/// `GRADE_A`. Matches the web `^[A-Z][A-Z0-9_]*$`.
enum LookupCode {
    static func isValid(_ raw: String) -> Bool {
        let s = raw.trimmingCharacters(in: .whitespaces)
        guard let first = s.first, first.isLetter, first.isUppercase else { return false }
        return s.allSatisfy { ($0.isUppercase && $0.isLetter) || $0.isNumber || $0 == "_" }
    }
}

#if DEBUG
/// Self-check for the slice's non-trivial pure logic (IMEI + lookup-code rules).
/// Runs once from the Shipments / QC screens in DEBUG — the lazy stand-in for a
/// test target (none may be added). Traps here if a rule breaks.
enum ProcurementSelfCheck {
    nonisolated(unsafe) private static var ran = false

    static func runOnce() {
        guard !ran else { return }
        ran = true
        assert(Imei.isValid("123456789012345"))
        assert(!Imei.isValid("12345"))               // too short
        assert(!Imei.isValid("1234567890123456"))    // too long
        assert(!Imei.isValid("12345678901234a"))     // non-digit
        assert(LookupCode.isValid("GRADE_A"))
        assert(LookupCode.isValid("A1"))
        assert(!LookupCode.isValid("grade"))         // lowercase
        assert(!LookupCode.isValid("1A"))            // leading digit
        assert(!LookupCode.isValid(""))              // empty
    }
}
#endif
