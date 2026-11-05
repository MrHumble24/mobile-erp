import Foundation
import Observation

/// A tiny cache of the store-setting flags that gate navigation. Repairs is
/// hidden entirely while `repairsEnabled` is off (ADR 0040), and the shell has
/// no settings of its own, so this loads `GET /settings` once after sign-in (and
/// again when settings are saved) and exposes just the flags the shell needs.
/// Defaults keep a gated feature hidden until the first successful load.
@MainActor
@Observable
final class StoreFlags {
    private(set) var repairsEnabled = false

    private struct Flags: Decodable { let repairsEnabled: Bool? }

    func refresh(api: APIClient) async {
        guard let f: Flags = try? await api.get("/settings") else { return }
        repairsEnabled = f.repairsEnabled ?? false
    }
}
