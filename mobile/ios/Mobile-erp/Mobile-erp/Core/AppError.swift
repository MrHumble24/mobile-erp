import Foundation

/// Normalized API failure. Maps the server envelope
/// `{ statusCode, message: string | string[], error }` into one shape so the UI
/// never parses a raw response. `statusCode == 0` means the request never
/// reached the server (offline / timeout).
struct AppError: Error, Identifiable {
    let id = UUID()
    let statusCode: Int
    let message: String
    let error: String?

    var isNetwork: Bool { statusCode == 0 }
    var isUnauthorized: Bool { statusCode == 401 }

    init(statusCode: Int, message: String, error: String? = nil) {
        self.statusCode = statusCode
        self.message = message
        self.error = error
    }

    /// Decode the envelope from a non-2xx response body.
    init(statusCode: Int, body: Data) {
        let env = try? JSONDecoder().decode(Envelope.self, from: body)
        self.statusCode = statusCode
        self.message = env?.message.joined() ?? "Request failed"
        self.error = env?.error
    }

    static let network = AppError(statusCode: 0, message: "No connection to the server.")

    private struct Envelope: Decodable {
        let message: Message
        let error: String?
    }

    /// `message` is a string or an array of strings in the envelope.
    private enum Message: Decodable {
        case one(String)
        case many([String])

        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let s = try? c.decode(String.self) { self = .one(s) }
            else { self = .many((try? c.decode([String].self)) ?? []) }
        }

        func joined() -> String {
            switch self {
            case .one(let s): return s
            case .many(let xs): return xs.joined(separator: ", ")
            }
        }
    }
}
