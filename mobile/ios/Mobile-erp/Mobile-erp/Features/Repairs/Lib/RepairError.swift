import Foundation

/// Maps a `/repairs` failure to a readable message (ADR 0040). The server raises
/// stable `code`s; we key off them. The `repairs` namespace may not be bundled
/// yet, so each has an English fallback (never Uzbek).
enum RepairError {
    static func message(_ e: AppError, _ i18n: I18n) -> String {
        switch e.code {
        case "REPAIRS_DISABLED":
            return i18n.t("repairs.errorDisabled", default: "Repairs are turned off in settings.")
        case "REPAIR_ILLEGAL_MOVE":
            return i18n.t("repairs.errorIllegalMove", default: "That status change is not allowed.")
        case "REPAIR_TERMINAL":
            return i18n.t("repairs.errorTerminal", default: "This ticket is closed and cannot be changed.")
        case "REPAIR_BALANCE_OWED":
            return i18n.t("repairs.errorBalanceOwed", default: "Money is still owed — add a reason to give it back.")
        case "REPAIR_NOT_OUTSIDE":
            return i18n.t("repairs.errorNotOutside", default: "This ticket has no outside master.")
        case "NO_OPEN_SHIFT":
            return i18n.t("shifts.shiftRequired")
        default:
            return e.message
        }
    }
}
