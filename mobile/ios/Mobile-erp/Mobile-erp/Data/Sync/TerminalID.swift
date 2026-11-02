import Foundation

/// This device's stable `terminalId`, sent with every `/sync/push`. Generated
/// once and persisted in the keychain so it survives reinstalls-in-place.
enum TerminalID {
    static func load(_ keychain: Keychain) -> String {
        if let existing = keychain.string(.terminalID), !existing.isEmpty {
            return existing
        }
        let fresh = newUUID()
        keychain.set(fresh, for: .terminalID)
        return fresh
    }
}
