import Foundation

/// Which backend the app talks to. Three environments; the token is per-env, so
/// switching clears the session and returns to login.
enum AppEnv: String, CaseIterable, Identifiable {
    case production, staging, development
    var id: String { rawValue }
    var title: String {
        switch self {
        case .production: return "Production"
        case .staging: return "Staging"
        case .development: return "Development"
        }
    }
}

/// Resolves the Development host without the user typing an IP.
///  - Simulator: `localhost` (source "simulator").
///  - Device: the build Mac's LAN IP, injected into the built Info.plist as
///    `DevHost` by a build phase (source "auto (build Mac)").
///  - Neither: `localhost` (source "localhost").
enum DevHost {
    static func resolve() -> (host: String, source: String) {
        #if targetEnvironment(simulator)
        return ("localhost", "simulator")
        #else
        if let h = Bundle.main.object(forInfoDictionaryKey: "DevHost") as? String,
           !h.trimmingCharacters(in: .whitespaces).isEmpty {
            return (h, "auto (build Mac)")
        }
        return ("localhost", "localhost")
        #endif
    }

    static var url: String { "http://\(resolve().host):\(AppConfig.devPort)" }
}

/// Runtime API configuration: the active environment and per-environment URL
/// overrides. Persisted in UserDefaults (not secret — just URLs), loaded at
/// launch. `APIClient` reads `baseURL` per request, so switching environment or
/// editing a URL in the console applies immediately without a relaunch.
@Observable
final class DevConfig {
    var env: AppEnv
    var isHttpCacheEnabled: Bool
    /// Per-env user override; absent/empty ⇒ use the auto/default URL.
    private var overrides: [AppEnv: String]

    var baseURL: URL {
        URL(string: url(for: env)) ?? URL(string: AppConfig.defaultProdURL)!
    }

    /// The effective URL for an environment (override if set, else the default).
    func url(for env: AppEnv) -> String {
        if let o = overrides[env], !o.isEmpty { return o }
        return Self.defaultURL(for: env)
    }

    /// The factory/auto URL for an environment, ignoring any override.
    static func defaultURL(for env: AppEnv) -> String {
        switch env {
        case .production: return AppConfig.defaultProdURL
        case .staging: return AppConfig.defaultStagingURL
        case .development: return DevHost.url
        }
    }

    func isOverridden(_ env: AppEnv) -> Bool {
        (overrides[env]?.isEmpty == false)
    }

    /// False when the environment has no URL yet (Staging before one is entered).
    func isConfigured(_ env: AppEnv) -> Bool {
        !url(for: env).isEmpty
    }

    private enum Keys {
        static let env = "dev_env"
        static func override(_ env: AppEnv) -> String { "dev_url_\(env.rawValue)" }
        static let httpCacheEnabled = "dev_http_cache_enabled"
    }

    init(env: AppEnv, overrides: [AppEnv: String], isHttpCacheEnabled: Bool = false) {
        self.env = env
        self.overrides = overrides
        self.isHttpCacheEnabled = isHttpCacheEnabled
    }

    /// Reads the persisted config, falling back to defaults.
    static func load(_ store: UserDefaults = .standard) -> DevConfig {
        let env = AppEnv(rawValue: store.string(forKey: Keys.env) ?? "") ?? .production
        var overrides: [AppEnv: String] = [:]
        for e in AppEnv.allCases {
            if let v = store.string(forKey: Keys.override(e)), !v.isEmpty { overrides[e] = v }
        }
        let isHttpCacheEnabled = store.bool(forKey: Keys.httpCacheEnabled)
        return DevConfig(env: env, overrides: overrides, isHttpCacheEnabled: isHttpCacheEnabled)
    }

    /// Toggles HTTP network cache. Clears URLCache when turning off.
    func setHttpCacheEnabled(_ enabled: Bool, store: UserDefaults = .standard) {
        self.isHttpCacheEnabled = enabled
        store.set(enabled, forKey: Keys.httpCacheEnabled)
        if !enabled {
            URLCache.shared.removeAllCachedResponses()
        }
    }

    /// Switches the active environment and persists it.
    func select(_ env: AppEnv, store: UserDefaults = .standard) {
        self.env = env
        store.set(env.rawValue, forKey: Keys.env)
    }

    /// Persists (or, with nil/empty, clears) an environment's URL override.
    func setOverride(_ url: String?, for env: AppEnv, store: UserDefaults = .standard) {
        let trimmed = url?.trimmingCharacters(in: .whitespaces) ?? ""
        if trimmed.isEmpty {
            overrides[env] = nil
            store.removeObject(forKey: Keys.override(env))
        } else {
            overrides[env] = trimmed
            store.set(trimmed, forKey: Keys.override(env))
        }
    }

    /// Drops the override so the environment reverts to its auto/default URL.
    func resetToDefault(for env: AppEnv, store: UserDefaults = .standard) {
        setOverride(nil, for: env, store: store)
    }
}
