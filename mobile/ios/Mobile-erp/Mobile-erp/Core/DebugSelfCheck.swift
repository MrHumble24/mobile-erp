#if DEBUG
import Foundation

/// Assert-based self-check for the non-trivial pure logic (money parsing, JWT
/// expiry, error-envelope decoding). Runs once at launch in DEBUG only — the
/// lazy stand-in for a full test target. If any of these break, the app traps
/// here instead of misbehaving in the field.
func runDebugSelfChecks() {
    // Money: whole vs. fractional, exact Decimal (never Double).
    assert(MoneyText.format("1250") == "$1,250")
    assert(MoneyText.format("1250.50") == "$1,250.50")
    assert(MoneyText.format(nil) == "$0")

    // Error envelope: string[] message is joined; status surfaced.
    let body = #"{"statusCode":400,"message":["a","b"],"error":"Bad Request"}"#
    let err = AppError(statusCode: 400, body: Data(body.utf8))
    assert(err.message == "a, b" && err.error == "Bad Request")

    // JWT expiry: past exp → expired, future exp → live, garbage → expired.
    assert(isJWTExpired(makeJWT(exp: 1)))                 // 1970
    assert(!isJWTExpired(makeJWT(exp: 4_102_444_800)))    // year 2100
    assert(isJWTExpired("not-a-jwt"))
}

private func makeJWT(exp: Int) -> String {
    func seg(_ obj: [String: Any]) -> String {
        let data = try! JSONSerialization.data(withJSONObject: obj)
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
    return "\(seg(["alg": "HS256"])).\(seg(["exp": exp])).sig"
}
#endif
