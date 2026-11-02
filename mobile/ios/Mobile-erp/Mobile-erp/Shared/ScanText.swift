import Foundation

/// Reads codes out of camera OCR text (box label, *#06# screen, price tag).
/// Printed numbers are often grouped ("35 209900 176148 1", "35-209900-176148-1"),
/// so for IMEIs single spaces/dashes between digits are dropped. Mirrors Android `shared/lib/ScanText.kt`.
enum ScanText {
    private static let groupedRun = try! Regex(#"\d(?:[ -]?\d)*"#)
    /// No spaces: on a label, "A2890 128GB" is two numbers, not one.
    private static let wordRun = try! Regex(#"\d(?:-?\d)*"#)
    private static let imeiLength = 15
    private static let minNumberDigits = 4

    /// First Luhn-valid 15-digit IMEI: the check digit rejects misreads and random numbers.
    static func imei(in text: String) -> String? {
        for digits in runs(text, groupedRun) where digits.count >= imeiLength {
            let chars = Array(digits)
            // A run longer than 15 can hold an IMEI glued to other digits.
            for start in 0...(chars.count - imeiLength) {
                let candidate = String(chars[start..<start + imeiLength])
                if isLuhnValid(candidate) { return candidate }
            }
        }
        return nil
    }

    /// Every number of 4+ digits (one per printed word), in reading order, no repeats — for the user to pick from.
    static func numbers(in text: String) -> [String] {
        var seen = Set<String>()
        return runs(text, wordRun).filter { $0.count >= minNumberDigits && seen.insert($0).inserted }
    }

    static func isLuhnValid(_ digits: String) -> Bool {
        let values = digits.compactMap(\.wholeNumberValue)
        guard values.count == imeiLength, digits.count == imeiLength else { return false }
        let sum = values.reversed().enumerated().reduce(0) { acc, item in
            guard item.offset % 2 == 1 else { return acc + item.element }
            let doubled = item.element * 2
            return acc + (doubled > 9 ? doubled - 9 : doubled)
        }
        return sum % 10 == 0
    }

    private static func runs(_ text: String, _ pattern: Regex<AnyRegexOutput>) -> [String] {
        text.matches(of: pattern).map { String(text[$0.range].filter(\.isNumber)) }
    }
}

#if DEBUG
func runScanTextSelfChecks() {
    assert(ScanText.imei(in: "IMEI: 490154203237518") == "490154203237518")
    assert(ScanText.imei(in: "IMEI1 49-015420-323751-8") == "490154203237518")
    assert(ScanText.imei(in: "49 015420 323751 8 / 01") == "490154203237518")
    assert(ScanText.imei(in: "490154203237519") == nil)        // bad check digit
    assert(ScanText.imei(in: "Model A2890 128GB") == nil)
    assert(ScanText.numbers(in: "A2890 128GB 1-200-000 so'm A2890") == ["2890", "1200000"])
}
#endif
