import Foundation

/// True when `token` is a JWT whose `exp` is already past, or is malformed
/// enough that it can't be trusted. Used by session restore so an expired 12h
/// token isn't treated as a live offline session. No `exp` claim → treated as
/// non-expiring (the server always sets one).
func isJWTExpired(_ token: String, now: Date = Date()) -> Bool {
    let parts = token.split(separator: ".")
    guard parts.count == 3 else { return true }
    guard let data = base64URLDecode(String(parts[1])),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return true }
    guard let exp = json["exp"] as? Double else { return false }
    return now >= Date(timeIntervalSince1970: exp)
}

private func base64URLDecode(_ s: String) -> Data? {
    var str = s.replacingOccurrences(of: "-", with: "+")
        .replacingOccurrences(of: "_", with: "/")
    let pad = str.count % 4
    if pad > 0 { str += String(repeating: "=", count: 4 - pad) }
    return Data(base64Encoded: str)
}
