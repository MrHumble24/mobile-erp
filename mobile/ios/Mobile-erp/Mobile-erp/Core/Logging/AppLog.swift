import Foundation
import Observation
import os

/// Severity of an app log line. `rawValue` doubles as the capsule label source.
enum AppLogLevel: String, CaseIterable, Identifiable {
    case debug, info, warn, error
    var id: String { rawValue }
    var label: String { rawValue.uppercased() }
}

/// One structured app log line. `tag` groups by subsystem (auth, sync, net…).
struct AppLogEntry: Identifiable {
    let id = UUID()
    let date: Date
    let level: AppLogLevel
    let tag: String
    let message: String
}

/// In-memory ring buffer of app log lines (no persistence) plus an `os.Logger`
/// mirror so Console.app still captures them. `@Observable` so the developer
/// console updates live. Call through the static one-liners at event sites:
/// `AppLog.info("auth", "login ok")`.
@Observable
@MainActor
final class AppLog {
    static let shared = AppLog()

    /// Oldest first; the console shows them newest first. Capped at `capacity`.
    private(set) var entries: [AppLogEntry] = []
    static let capacity = 500

    @ObservationIgnored private let logger = Logger(subsystem: "abdulboriy.Mobile-erp", category: "app")

    init() {}

    func log(_ level: AppLogLevel, _ tag: String, _ message: String) {
        entries.append(AppLogEntry(date: Date(), level: level, tag: tag, message: message))
        if entries.count > Self.capacity { entries.removeFirst(entries.count - Self.capacity) }
        // Only the shared log mirrors to Console; throwaway instances (self-checks) stay silent.
        if self === Self.shared { logger.log(level: level.osType, "[\(tag, privacy: .public)] \(message, privacy: .public)") }
    }

    func clear() { entries.removeAll() }

    // One-liners for call sites.
    static func debug(_ tag: String, _ message: String) { shared.log(.debug, tag, message) }
    static func info(_ tag: String, _ message: String) { shared.log(.info, tag, message) }
    static func warn(_ tag: String, _ message: String) { shared.log(.warn, tag, message) }
    static func error(_ tag: String, _ message: String) { shared.log(.error, tag, message) }
}

private extension AppLogLevel {
    var osType: OSLogType {
        switch self {
        case .debug: return .debug
        case .info: return .info
        case .warn: return .default
        case .error: return .error
        }
    }
}
