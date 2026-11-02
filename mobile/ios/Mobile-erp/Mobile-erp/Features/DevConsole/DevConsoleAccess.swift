import Foundation
import Observation

/// Session-scoped access to the developer console.
///  - The login screen's "Developer settings" button gates entry behind the
///    access code `153535` (a convenience gate, not a security boundary).
///  - In DEBUG builds the Developer tab is always shown after sign-in.
///  - In release builds it appears only once the code was entered this session.
@Observable
@MainActor
final class DevConsoleAccess {
    static let code = "153535"

    private(set) var unlocked = false

    /// Returns true and unlocks when the entered code matches.
    @discardableResult
    func unlock(_ entered: String) -> Bool {
        if entered == Self.code { unlocked = true }
        return unlocked
    }

    /// Whether the in-shell Developer tab/sidebar entry should be shown.
    var showsTab: Bool {
        #if DEBUG
        return true
        #else
        return unlocked
        #endif
    }
}
