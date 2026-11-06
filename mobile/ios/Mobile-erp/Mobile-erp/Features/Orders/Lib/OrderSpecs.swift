import Foundation

/// The storefront variant line (storage, color, …) as one string, mirroring the
/// website: every spec value joined with " · ", blanks dropped. Nil when empty.
enum OrderSpecs {
    static func line(_ specs: [String: String]?) -> String? {
        guard let specs else { return nil }
        let parts = specs
            .sorted { $0.key < $1.key }
            .map(\.value)
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        let joined = parts.joined(separator: " · ")
        return joined.isEmpty ? nil : joined
    }
}
