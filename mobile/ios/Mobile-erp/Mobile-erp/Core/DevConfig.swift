import Foundation

/// Which backend the app talks to. Switched from the hidden dev panel.
enum AppEnv: String { case production, development }

/// Runtime API configuration: the active environment and each environment's
/// base URL. Persisted in UserDefaults (not secret — just URLs), loaded at
/// launch. `APIClient` reads `baseURL` per request, so switching the
/// environment in the dev panel applies immediately without a relaunch.
@Observable
final class DevConfig {
    var env: AppEnv
    var prodURL: String
    var devURL: String

    var baseURL: URL {
        URL(string: env == .development ? devURL : prodURL)
            ?? URL(string: AppConfig.defaultProdURL)!
    }

    private enum Keys {
        static let env = "dev_env"
        static let prod = "dev_url_prod"
        static let dev = "dev_url_dev"
    }

    init(env: AppEnv, prodURL: String, devURL: String) {
        self.env = env
        self.prodURL = prodURL
        self.devURL = devURL
    }

    /// Reads the persisted config, falling back to build-time defaults.
    static func load(_ store: UserDefaults = .standard) -> DevConfig {
        let env = AppEnv(rawValue: store.string(forKey: Keys.env) ?? "") ?? .production
        let prod = nonEmpty(store.string(forKey: Keys.prod)) ?? AppConfig.defaultProdURL
        let dev = nonEmpty(store.string(forKey: Keys.dev)) ?? AppConfig.defaultDevURL
        return DevConfig(env: env, prodURL: prod, devURL: dev)
    }

    /// Persists the edited config and applies it in place.
    func save(env: AppEnv, prodURL: String, devURL: String, store: UserDefaults = .standard) {
        self.env = env
        self.prodURL = prodURL.trimmingCharacters(in: .whitespaces)
        self.devURL = devURL.trimmingCharacters(in: .whitespaces)
        store.set(env.rawValue, forKey: Keys.env)
        store.set(self.prodURL, forKey: Keys.prod)
        store.set(self.devURL, forKey: Keys.dev)
    }

    private static func nonEmpty(_ s: String?) -> String? {
        (s?.isEmpty == false) ? s : nil
    }
}
