import SwiftUI

/// Small colored capsule used for HTTP status and log level. Caldera tokens.
struct DevCapsule: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .monospaced()
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
            .background(color.opacity(0.16), in: Capsule())
            .foregroundStyle(color)
    }
}

extension NetLogEntry.Outcome {
    var color: Color {
        switch self {
        case .success: return Tokens.success
        case .redirect: return Tokens.signalBlue
        case .clientError: return Tokens.warning
        case .serverError: return Tokens.danger
        case .failed: return Tokens.slate
        }
    }
}

extension AppLogLevel {
    var color: Color {
        switch self {
        case .debug: return Tokens.slate
        case .info: return Tokens.signalBlue
        case .warn: return Tokens.warning
        case .error: return Tokens.danger
        }
    }
}

/// Monospaced, selectable, scrollable body block (JSON / headers / cURL).
struct DevMonoBlock: View {
    let text: String

    var body: some View {
        ScrollView(.horizontal) {
            Text(text.isEmpty ? "—" : text)
                .font(.mono(12))
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Short time-of-day stamp for list rows.
enum DevTime {
    static func string(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss.SSS"
        return f.string(from: date)
    }
}
