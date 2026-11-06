import Foundation
import Observation

/// Manages the active store selection (ADR 0058).
/// Rules (Item 2):
///  - 1 store: chosen automatically without asking.
///  - Several stores and none saved (or saved store no longer in list): nil (prompt user).
///  - Several stores and saved store valid: kept across app restarts.
///  - Signing out clears it.
@Observable
@MainActor
final class StoreManager {
    private(set) var activeStoreID: String?
    @ObservationIgnored private let keychain: Keychain

    init(keychain: Keychain) {
        self.keychain = keychain
        self.activeStoreID = keychain.string(.activeStoreID)
    }

    func setActiveStoreID(_ id: String?) {
        keychain.set(id, for: .activeStoreID)
        self.activeStoreID = id
    }

    func clear() {
        setActiveStoreID(nil)
    }

    @discardableResult
    func sync(with user: AuthUser?) -> String? {
        guard let user else {
            clear()
            return nil
        }
        let saved = keychain.string(.activeStoreID)
        let resolved = Self.resolveActiveStore(stores: user.stores, savedStoreID: saved)
        if resolved != saved {
            setActiveStoreID(resolved)
        } else {
            self.activeStoreID = resolved
        }
        return resolved
    }

    /// Pure logic for active store resolution (Item 2).
    static func resolveActiveStore(stores: [UserStore], savedStoreID: String?) -> String? {
        if stores.count == 1 {
            return stores[0].id
        }
        if stores.count > 1 {
            if let savedStoreID, stores.contains(where: { $0.id == savedStoreID }) {
                return savedStoreID
            }
            return nil
        }
        return nil
    }
}

