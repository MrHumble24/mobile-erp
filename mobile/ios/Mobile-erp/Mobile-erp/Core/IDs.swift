import Foundation

/// The one id generator — outbox mutation ids and the terminal id.
/// Lowercased to match the server's UUID expectations and the web/Flutter
/// clients. Nothing else should mint ids.
func newUUID() -> String { UUID().uuidString.lowercased() }
