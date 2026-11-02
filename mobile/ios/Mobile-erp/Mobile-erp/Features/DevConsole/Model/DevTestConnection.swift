import Foundation
import Observation

/// Probes an environment's base URL and reports reachable / latency / error.
/// Hits the server's public `GET /health`; any HTTP response — including 401 —
/// counts as reachable (only a transport failure is "unreachable").
///
/// ponytail: uses `URLSession.shared` directly, not `APIClient`, on purpose —
/// it must probe an arbitrary env URL (not the active one), report non-2xx /
/// 401 as reachable, and never trip the 401 session-clear. Not a data path.
@Observable
@MainActor
final class DevTestConnection {
    enum Outcome: Equatable {
        case idle, testing
        case reachable(ms: Int, status: Int)
        case failed(String)
    }

    private(set) var outcome: Outcome = .idle

    func reset() { outcome = .idle }

    func run(baseURL: String) async {
        let trimmed = baseURL.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, let base = URL(string: trimmed) else {
            outcome = .failed("Invalid URL"); return
        }
        outcome = .testing
        var req = URLRequest(url: base.appendingPathComponent("health"), timeoutInterval: 8)
        req.httpMethod = "GET"
        let start = Date()
        do {
            let (_, response) = try await URLSession.shared.data(for: req)
            let ms = Int(Date().timeIntervalSince(start) * 1000)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            outcome = .reachable(ms: ms, status: status)
            AppLog.info("devconsole", "test \(trimmed) → \(status) in \(ms)ms")
        } catch {
            outcome = .failed(error.localizedDescription)
            AppLog.warn("devconsole", "test \(trimmed) failed: \(error.localizedDescription)")
        }
    }
}
