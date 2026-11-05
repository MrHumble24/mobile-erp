import Foundation

/// The repair ticket state machine (ADR 0040), mirroring the server
/// `repair-status.ts`. Legal moves only; the server refuses anything else 409.
/// GIVEN_BACK and CANCELLED are terminal. Pure — covered by a DEBUG self-check.
enum RepairStatus {
    static let all = ["RECEIVED", "IN_REPAIR", "READY", "GIVEN_BACK", "CANCELLED"]

    private static let moves: [String: [String]] = [
        "RECEIVED": ["IN_REPAIR", "READY", "CANCELLED"],
        "IN_REPAIR": ["READY", "RECEIVED", "CANCELLED"],
        "READY": ["GIVEN_BACK", "IN_REPAIR", "CANCELLED"],
        "GIVEN_BACK": [],
        "CANCELLED": [],
    ]
    private static let terminal: Set<String> = ["GIVEN_BACK", "CANCELLED"]

    /// The legal next statuses from `from`, in display order.
    static func nextMoves(from: String) -> [String] { moves[from] ?? [] }

    static func isLegalMove(from: String, to: String) -> Bool { nextMoves(from: from).contains(to) }
    static func isTerminal(_ code: String) -> Bool { terminal.contains(code) }

    /// A localized label for a status code, with an English fallback (the
    /// `repairs` namespace may not be bundled yet).
    static func label(_ code: String, _ i18n: I18n) -> String {
        i18n.t("repairs.status_\(code)", default: fallback[code] ?? code)
    }

    private static let fallback: [String: String] = [
        "RECEIVED": "Received", "IN_REPAIR": "In repair", "READY": "Ready",
        "GIVEN_BACK": "Given back", "CANCELLED": "Cancelled",
    ]
}

#if DEBUG
/// Self-check: the legal moves and terminal rule match the server.
enum RepairStatusSelfCheck {
    static let ran: Void = {
        assert(RepairStatus.isLegalMove(from: "RECEIVED", to: "IN_REPAIR"))
        assert(RepairStatus.isLegalMove(from: "READY", to: "GIVEN_BACK"))
        assert(!RepairStatus.isLegalMove(from: "RECEIVED", to: "GIVEN_BACK"))
        assert(!RepairStatus.isLegalMove(from: "GIVEN_BACK", to: "RECEIVED"))
        assert(RepairStatus.isTerminal("CANCELLED"))
        assert(!RepairStatus.isTerminal("READY"))
        assert(RepairStatus.nextMoves(from: "IN_REPAIR") == ["READY", "RECEIVED", "CANCELLED"])
        assert(RepairStatus.nextMoves(from: "CANCELLED").isEmpty)
    }()
}
#endif
