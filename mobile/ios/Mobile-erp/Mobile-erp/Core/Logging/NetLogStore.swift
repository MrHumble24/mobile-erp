import Foundation
import Observation

/// One captured HTTP request/response. Filled in two steps: `begin` records the
/// request, `finish` adds the outcome. Sensitive values are masked and bodies
/// truncated before they are ever stored (see `NetLogMask`).
struct NetLogEntry: Identifiable {
    let id = UUID()
    let start: Date
    let method: String
    let url: String
    let requestHeaders: [String: String]
    let requestBody: String?

    var status: Int?          // nil until the request completes; nil + error ⇒ failed
    var responseHeaders: [String: String] = [:]
    var responseBody: String?
    var durationMs: Int?
    var error: String?

    /// Coarse outcome bucket used for the status capsule / filter.
    enum Outcome: String, CaseIterable, Identifiable {
        case success, redirect, clientError, serverError, failed
        var id: String { rawValue }
        var title: String {
            switch self {
            case .success: return "2xx"
            case .redirect: return "3xx"
            case .clientError: return "4xx"
            case .serverError: return "5xx"
            case .failed: return "Failed"
            }
        }
    }

    var outcome: Outcome {
        guard let status else { return .failed }
        switch status {
        case 200..<300: return .success
        case 300..<400: return .redirect
        case 400..<500: return .clientError
        default: return .serverError
        }
    }
}

/// In-memory ring buffer of network calls (no persistence). Fed by `APIClient`
/// around every request. `@Observable` so the console updates live.
@Observable
@MainActor
final class NetLogStore {
    static let shared = NetLogStore()

    /// Oldest first; the console shows them newest first. Capped at `capacity`.
    private(set) var entries: [NetLogEntry] = []
    static let capacity = 300

    init() {}

    /// Records an outgoing request, returning the id used to complete it.
    @discardableResult
    func begin(method: String, url: String, headers: [String: String], body: Data?) -> UUID {
        let entry = NetLogEntry(
            start: Date(), method: method, url: url,
            requestHeaders: NetLogMask.headers(headers),
            requestBody: NetLogMask.body(body)
        )
        entries.append(entry)
        if entries.count > Self.capacity { entries.removeFirst(entries.count - Self.capacity) }
        return entry.id
    }

    /// Completes a request with its outcome.
    func finish(_ id: UUID, status: Int?, headers: [String: String] = [:],
                body: Data?, error: String? = nil) {
        guard let i = entries.firstIndex(where: { $0.id == id }) else { return }
        entries[i].status = status
        entries[i].responseHeaders = NetLogMask.headers(headers)
        entries[i].responseBody = NetLogMask.body(body)
        entries[i].error = error
        entries[i].durationMs = Int(Date().timeIntervalSince(entries[i].start) * 1000)
    }

    func clear() { entries.removeAll() }
}

/// Masks secrets and caps body size before anything is stored.
enum NetLogMask {
    static let bodyLimit = 64 * 1024

    static func headers(_ h: [String: String]) -> [String: String] {
        h.reduce(into: [:]) { out, kv in
            out[kv.key] = kv.key.caseInsensitiveCompare("Authorization") == .orderedSame
                ? "Bearer ***" : kv.value
        }
    }

    /// Masks any JSON `password` field, then truncates at 64 KB.
    static func body(_ data: Data?) -> String? {
        guard let data, !data.isEmpty else { return nil }
        let capped = data.count > bodyLimit ? data.prefix(bodyLimit) : data[...]
        var text = String(decoding: capped, as: UTF8.self)
        text = maskPasswords(text)
        if data.count > bodyLimit { text += "\n… (truncated, \(data.count) bytes)" }
        return text
    }

    /// Redacts `"password": "…"` occurrences without needing valid JSON.
    static func maskPasswords(_ text: String) -> String {
        guard let re = try? NSRegularExpression(
            pattern: #"("password"\s*:\s*)"(?:[^"\\]|\\.)*""#, options: [.caseInsensitive]
        ) else { return text }
        let range = NSRange(text.startIndex..., in: text)
        return re.stringByReplacingMatches(in: text, range: range, withTemplate: #"$1"***""#)
    }
}
