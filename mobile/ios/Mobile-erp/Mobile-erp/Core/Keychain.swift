import Foundation
import Security

/// The one secure store. Holds the 12h JWT and the cached user JSON — the only
/// secrets the app keeps. Dev-panel URLs and the locale are not secret and live
/// in UserDefaults. Keys are stable so nothing drifts.
struct Keychain {
    enum Key: String {
        case token = "auth_token"
        case user = "auth_user"
        case activeStoreID = "active_store_id"
        case terminalID = "terminal_id"
    }

    private let service = "abdulboriy.Mobile-erp"

    func string(_ key: Key) -> String? {
        guard let data = read(key) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func set(_ value: String?, for key: Key) {
        guard let value, let data = value.data(using: .utf8) else {
            delete(key); return
        }
        var query = baseQuery(key)
        let attrs: [String: Any] = [kSecValueData as String: data]
        let status = SecItemUpdate(query as CFDictionary, attrs as CFDictionary)
        if status == errSecItemNotFound {
            query[kSecValueData as String] = data
            SecItemAdd(query as CFDictionary, nil)
        }
    }

    func delete(_ key: Key) {
        SecItemDelete(baseQuery(key) as CFDictionary)
    }

    private func read(_ key: Key) -> Data? {
        var query = baseQuery(key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess else {
            return nil
        }
        return out as? Data
    }

    private func baseQuery(_ key: Key) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
        ]
    }
}
