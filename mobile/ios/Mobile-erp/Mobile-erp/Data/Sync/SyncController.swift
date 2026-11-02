import Foundation
import SwiftData

/// Orchestrates offline sync: push the outbox first (so local writes land),
/// then pull fresh changes. Runs on launch, on login, and whenever
/// connectivity flips back to online — never on a timer. Single-flight:
/// overlapping triggers are dropped. Feature agents never edit this; they
/// enqueue to the outbox and read the cache.
@MainActor
final class SyncController {
    private let api: APIClient
    private let context: ModelContext
    private let terminalID: String
    private let hasToken: () -> Bool
    private var running = false

    init(api: APIClient, context: ModelContext, terminalID: String, hasToken: @escaping () -> Bool) {
        self.api = api
        self.context = context
        self.terminalID = terminalID
        self.hasToken = hasToken
    }

    func syncNow() {
        Task { await run() }
    }

    func run() async {
        guard !running, hasToken() else { return }
        running = true
        defer { running = false }
        do {
            try await PushService(api: api, context: context, terminalID: terminalID).drain()
            try await PullService(api: api, context: context).pull()
        } catch {
            // Offline / transient failures are expected; the next trigger retries.
        }
    }
}
