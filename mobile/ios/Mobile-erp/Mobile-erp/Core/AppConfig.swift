import Foundation

/// Build-time defaults. The server has **no global prefix** and the LAN dev
/// server listens on :3000. Production/Staging URLs are the factory defaults
/// shown in the developer console; override any of them there at runtime
/// (persisted) without a rebuild. The Development URL is detected automatically
/// (build Mac LAN IP / simulator localhost) — see `DevHost`.
enum AppConfig {
    /// Default Production base URL.
    static let defaultProdURL = "https://mobile-api.abdulboriy.dev"
    /// Staging has no server yet — empty until a URL is entered in the console.
    static let defaultStagingURL = ""
    /// Port the LAN development server listens on.
    static let devPort = 3000
}
