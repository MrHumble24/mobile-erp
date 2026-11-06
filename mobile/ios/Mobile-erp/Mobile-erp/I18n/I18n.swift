import Foundation
import Observation

/// Translations bundled verbatim from the web client's single source
/// (`client/src/shared/i18n/{uz,en}`), copied into the app bundle under
/// `i18n/<locale>/<ns>.json` by a build-phase script — no hand-maintained copy.
///
/// `t("ns.key", ["name": x])` interpolates `{param}` placeholders. Default
/// locale is `uz`; a missing uz key falls back to en, then to any `default:`,
/// then the raw key. The active locale is persisted and `@Observable`, so
/// switching it re-renders the UI.
@Observable
final class I18n {
    private(set) var locale: String
    private let bundles: [String: [String: [String: String]]]

    /// Namespaces — the web client's namespaces (see its `index.ts`).
    static let namespaces = [
        "auth", "balance", "catalog", "common", "consignments", "credit", "customers", "customs", "dashboard",
        "expenses", "inventory", "nav", "orders", "partners", "pos", "pricing", "purchases", "qc",
        "reports", "repairs", "sales", "settings", "shifts", "shipments", "stores", "users",
    ]
    static let defaultLocale = "uz"
    private static let localeKey = "ui_locale"

    init(store: UserDefaults = .standard) {
        self.locale = store.string(forKey: Self.localeKey) ?? Self.defaultLocale
        var loaded: [String: [String: [String: String]]] = [:]
        for locale in ["uz", "en"] {
            var byNS: [String: [String: String]] = [:]
            for ns in Self.namespaces {
                byNS[ns] = Self.loadNamespace(locale: locale, ns: ns)
            }
            loaded[locale] = byNS
        }
        self.bundles = loaded
    }

    func setLocale(_ locale: String, store: UserDefaults = .standard) {
        self.locale = locale
        store.set(locale, forKey: Self.localeKey)
    }

    func t(_ key: String, _ params: [String: String] = [:], default fallback: String? = nil) -> String {
        guard let dot = key.firstIndex(of: ".") else { return key }
        let ns = String(key[..<dot])
        let name = String(key[key.index(after: dot)...])
        let text = bundles[locale]?[ns]?[name]
            ?? bundles[Self.defaultLocale]?[ns]?[name]
            ?? bundles["en"]?[ns]?[name]
            ?? fallback
        guard let text else { return key }
        return interpolate(text, params)
    }

    private func interpolate(_ text: String, _ params: [String: String]) -> String {
        guard !params.isEmpty else { return text }
        var out = text
        for (k, v) in params { out = out.replacingOccurrences(of: "{\(k)}", with: v) }
        return out
    }

    private static func loadNamespace(locale: String, ns: String) -> [String: String] {
        guard let url = Bundle.main.url(
            forResource: ns, withExtension: "json", subdirectory: "i18n/\(locale)"
        ),
            let data = try? Data(contentsOf: url),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return [:] }
        return json.reduce(into: [:]) { acc, pair in acc[pair.key] = "\(pair.value)" }
    }
}
