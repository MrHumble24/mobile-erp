import Foundation

#if DEBUG
/// Screenshot launch arguments (`-openSale first`, `-openCustomer first`, …),
/// each consumed once per process. Without this a view that is recreated on
/// every tab visit re-reads the still-present argument and reopens the same
/// row for as long as the process lives.
enum KitDebugLaunch {
    private static var consumed: Set<String> = []

    static func consume(_ key: String) -> String? {
        guard !consumed.contains(key), let value = UserDefaults.standard.string(forKey: key) else { return nil }
        consumed.insert(key)
        return value
    }
}
#endif
