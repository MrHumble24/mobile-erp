import Foundation

/// Finds an IMEI in OCR text (box label, *#06# screen, settings page).
/// Printed IMEIs are often grouped ("35 209900 176148 1", "35-209900-176148-1"),
/// so single spaces/dashes between digits are dropped. Only Luhn-valid 15-digit
/// runs count: the check digit rejects OCR misreads and random numbers.
/// Mirrors Android `shared/lib/ImeiText.kt`.
enum ImeiText {
    private static let digitRun = try! Regex(#"\d(?:[ -]?\d)*"#)

    static func find(in text: String) -> String? {
        for match in text.matches(of: digitRun) {
            let digits = Array(text[match.range].filter(\.isNumber))
            guard digits.count >= 15 else { continue }
            // A run longer than 15 can hold an IMEI glued to other digits.
            for start in 0...(digits.count - 15) {
                let candidate = String(digits[start..<start + 15])
                if isLuhnValid(candidate) { return candidate }
            }
        }
        return nil
    }

    static func isLuhnValid(_ digits: String) -> Bool {
        let values = digits.compactMap(\.wholeNumberValue)
        guard values.count == 15, digits.count == 15 else { return false }
        let sum = values.reversed().enumerated().reduce(0) { acc, item in
            guard item.offset % 2 == 1 else { return acc + item.element }
            let doubled = item.element * 2
            return acc + (doubled > 9 ? doubled - 9 : doubled)
        }
        return sum % 10 == 0
    }
}

#if DEBUG
func runImeiTextSelfChecks() {
    assert(ImeiText.find(in: "IMEI: 490154203237518") == "490154203237518")
    assert(ImeiText.find(in: "IMEI1 49-015420-323751-8") == "490154203237518")
    assert(ImeiText.find(in: "49 015420 323751 8 / 01") == "490154203237518")
    assert(ImeiText.find(in: "490154203237519") == nil)        // bad check digit
    assert(ImeiText.find(in: "Model A2890 128GB") == nil)
}
#endif
