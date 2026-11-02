#if DEBUG
import Foundation

/// Assert-based self-check for the kit's non-trivial pure logic: CSV escaping
/// and the router's one-shot consume. Run once at launch (`KitSelfCheck.run()`
/// from `AppContainer.bootstrap`). DEBUG only — the lazy stand-in for a test
/// target, matching the Core/Reports self-checks.
enum KitSelfCheck {
    @MainActor static func run() {
        checkCSV()
        checkRouter()
    }

    private static func checkCSV() {
        // Plain fields pass through untouched.
        assert(KitCSV.escape("356938035643809") == "356938035643809")
        // Comma, quote and newline force quoting; internal quotes double.
        assert(KitCSV.escape("a,b") == "\"a,b\"")
        assert(KitCSV.escape("say \"hi\"") == "\"say \"\"hi\"\"\"")
        assert(KitCSV.escape("line1\nline2") == "\"line1\nline2\"")
        // A whole document: header + one escaped row, CRLF-joined.
        let doc = KitCSV.build(headers: ["imei", "note"], rows: [["123", "a,b"]])
        assert(doc == "imei,note\r\n123,\"a,b\"")
    }

    @MainActor private static func checkRouter() {
        let r = KitRouter()
        r.open(.inventory(imei: "999"))
        assert(r.selection == "inventory")
        // Only the targeted feature consumes; it is one-shot.
        assert(r.consume("pos") == nil)
        assert(r.consume("inventory") == .inventory(imei: "999"))
        assert(r.consume("inventory") == nil)
    }
}
#endif
