import Foundation

/// A per-user permission override: inherit from roles, or an explicit
/// grant/revoke that wins over the role grant. Mirrors the web three-state
/// override row.
enum OverrideState: String {
    case inherit, grant, revoke
}

/// Pure helpers for the user permission matrix: build the initial state from
/// the server breakdown, and reduce the edited state back into the override
/// list the API expects (only non-inherit entries are sent).
enum OverrideMatrix {
    static func initial(from overrides: [OverrideEntry]) -> [String: OverrideState] {
        var map: [String: OverrideState] = [:]
        for o in overrides { map[o.permissionCode] = o.granted ? .grant : .revoke }
        return map
    }

    static func payload(_ state: [String: OverrideState]) -> [[String: Any]] {
        state.compactMap { code, s in
            switch s {
            case .inherit: return nil
            case .grant: return ["permissionCode": code, "granted": true]
            case .revoke: return ["permissionCode": code, "granted": false]
            }
        }
    }

    /// True when the edited state differs from the saved one (either direction).
    static func isDirty(initial: [String: OverrideState], current: [String: OverrideState]) -> Bool {
        let codes = Set(initial.keys).union(current.keys)
        return codes.contains { (initial[$0] ?? .inherit) != (current[$0] ?? .inherit) }
    }
}

#if DEBUG
/// Self-check for the override matrix reducer (no app test target). Runs once
/// when the Users screen first binds, in DEBUG only.
func runUsersSelfChecks() {
    let initial = OverrideMatrix.initial(from: [
        OverrideEntry(permissionCode: "sale.read", granted: true, reason: nil),
        OverrideEntry(permissionCode: "sale.void", granted: false, reason: "policy"),
    ])
    assert(initial["sale.read"] == .grant && initial["sale.void"] == .revoke)

    // Payload drops inherit, keeps grant/revoke with the right flag.
    let payload = OverrideMatrix.payload(["a": .grant, "b": .revoke, "c": .inherit])
    assert(payload.count == 2)
    let grantA = payload.first { $0["permissionCode"] as? String == "a" }
    assert(grantA?["granted"] as? Bool == true)

    // Dirty detection, both directions.
    assert(!OverrideMatrix.isDirty(initial: ["a": .grant], current: ["a": .grant]))
    assert(OverrideMatrix.isDirty(initial: ["a": .grant], current: ["a": .inherit]))
    assert(OverrideMatrix.isDirty(initial: [:], current: ["a": .revoke]))
}
#endif
