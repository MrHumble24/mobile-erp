import Foundation

/// Pure formatting helpers for the console: pretty-print JSON, build a cURL
/// command, and render entries as shareable plain text. No UI, no state.
enum DevConsoleFormat {
    /// Pretty-prints a JSON body; returns the original text when it isn't JSON.
    static func prettyJSON(_ text: String?) -> String {
        guard let text, !text.isEmpty else { return "" }
        guard let data = text.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let pretty = try? JSONSerialization.data(
                withJSONObject: obj, options: [.prettyPrinted, .sortedKeys]),
              let out = String(data: pretty, encoding: .utf8)
        else { return text }
        return out
    }

    static func headerLines(_ headers: [String: String]) -> String {
        headers.sorted { $0.key < $1.key }
            .map { "\($0.key): \($0.value)" }
            .joined(separator: "\n")
    }

    /// A copy-pasteable cURL command (already-masked headers/body).
    static func curl(_ e: NetLogEntry) -> String {
        var parts = ["curl -X \(e.method) '\(e.url)'"]
        for (k, v) in e.requestHeaders.sorted(by: { $0.key < $1.key }) {
            parts.append("  -H '\(k): \(v)'")
        }
        if let body = e.requestBody, !body.isEmpty {
            parts.append("  --data '\(body.replacingOccurrences(of: "'", with: "'\\''"))'")
        }
        return parts.joined(separator: " \\\n")
    }

    /// Full plain-text dump of one network entry (for ShareLink).
    static func networkText(_ e: NetLogEntry) -> String {
        """
        \(e.method) \(e.url)
        status: \(e.status.map(String.init) ?? "failed")  \
        duration: \(e.durationMs.map { "\($0) ms" } ?? "—")  \
        time: \(DevTime.string(e.start))
        error: \(e.error ?? "—")

        — Request headers —
        \(headerLines(e.requestHeaders))

        — Request body —
        \(prettyJSON(e.requestBody))

        — Response headers —
        \(headerLines(e.responseHeaders))

        — Response body —
        \(prettyJSON(e.responseBody))
        """
    }

    /// All app-log lines as plain text, newest first (for ShareLink).
    static func logText(_ entries: [AppLogEntry]) -> String {
        entries.reversed().map {
            "\(DevTime.string($0.date)) [\($0.level.label)] \($0.tag): \($0.message)"
        }.joined(separator: "\n")
    }
}
