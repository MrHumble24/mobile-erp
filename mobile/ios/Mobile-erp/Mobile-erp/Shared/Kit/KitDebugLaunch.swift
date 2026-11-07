import Foundation

#if DEBUG
/// Screenshot launch arguments (`-openSale first`, `-openCustomer first`, …),
/// each consumed once per process. Without this a view that is recreated on
/// every tab visit re-reads the still-present argument and reopens the same
/// row for as long as the process lives.
enum KitDebugLaunch {
    private static var consumed: Set<String> = []

    /// Returns the value once; a reader that cannot map it (`accept` false)
    /// leaves it for the screen that can — several tabs share `openTab`.
    static func consume(_ key: String, accept: (String) -> Bool = { _ in true }) -> String? {
        guard !consumed.contains(key) else { return nil }
        var value = UserDefaults.standard.string(forKey: key)
        if value == nil {
            let args = ProcessInfo.processInfo.arguments
            if let idx = args.firstIndex(of: "-\(key)"), idx + 1 < args.count {
                value = args[idx + 1]
            }
        }
        guard let val = value, accept(val) else { return nil }
        consumed.insert(key)
        return val
    }
}
#endif
