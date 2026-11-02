import Foundation

/// Build-time defaults. The server has **no global prefix** and listens on
/// :3000. The production URL here is the factory default shown in the dev
/// panel; override it there at runtime (persisted) without a rebuild.
enum AppConfig {
    /// Default production base URL. Edit in the dev panel per environment.
    static let defaultProdURL = "http://localhost:3000"
    /// Default development base URL (LAN server during field testing).
    static let defaultDevURL = "http://localhost:3000"
}
