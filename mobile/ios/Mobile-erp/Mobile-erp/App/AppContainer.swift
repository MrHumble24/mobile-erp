import Foundation
import SwiftData
import Observation

/// The dependency container — the app's composition root. Built once at launch
/// and injected through the SwiftUI `Environment`; features read what they need
/// (`i18n`, `session`, `modelContext`, `outbox`, `connectivity`) from it rather
/// than importing singletons. One wiring place, no global state.
@Observable
@MainActor
final class AppContainer {
    let devConfig: DevConfig
    let i18n: I18n
    let connectivity: Connectivity
    let api: APIClient
    let session: Session
    let sync: SyncController
    let modelContainer: ModelContainer
    let terminalID: String
    let devAccess = DevConsoleAccess()
    let router = KitRouter()
    let toasts = KitToastCenter()
    /// Store-setting flags that gate navigation (repairs hidden while off, ADR 0040).
    let storeFlags = StoreFlags()

    var modelContext: ModelContext { modelContainer.mainContext }
    var outbox: Outbox { Outbox(context: modelContext) }
    func conflicts() -> ConflictStore { ConflictStore(api: api) }

    init() {
        let keychain = Keychain()
        let devConfig = DevConfig.load()
        self.devConfig = devConfig
        self.i18n = I18n()
        self.connectivity = Connectivity()
        self.terminalID = TerminalID.load(keychain)

        // SwiftData store; fall back to in-memory if the on-disk store can't open
        // (e.g. an incompatible older schema on a dev device) so the app still runs.
        let schema = Schema(LocalSchema.models)
        self.modelContainer = (try? ModelContainer(for: schema))
            ?? (try! ModelContainer(
                for: schema,
                configurations: ModelConfiguration(isStoredInMemoryOnly: true)))

        let api = APIClient(
            baseURL: { devConfig.baseURL },
            token: { keychain.string(.token) }
        )
        self.api = api

        let session = Session(repo: AuthRepository(api: api), keychain: keychain)
        self.session = session

        let sync = SyncController(
            api: api,
            context: modelContainer.mainContext,
            terminalID: terminalID,
            hasToken: { session.hasToken }
        )
        self.sync = sync

        // Cross-wire the three runtime edges now that every part exists.
        let flags = storeFlags
        api.onUnauthorized = { session.clear() }   // 401 → force re-login
        session.onLogin = { sync.syncNow(); Task { await flags.refresh(api: api) } } // login → hydrate
        connectivity.onReconnect = { sync.syncNow() } // regain network → sync
    }

    /// Called once from the root view on appear: sync if already online + signed in.
    func bootstrap() {
        #if DEBUG
        runDebugSelfChecks()
        KitSelfCheck.run()
        #endif
        if connectivity.isOnline {
            sync.syncNow()
            Task { await storeFlags.refresh(api: api) }
        }
    }

    #if DEBUG
    /// Screenshot helper: `-devEmail <email> -devPassword <password>` signs in
    /// against the Development environment at launch so command-line captures
    /// reach any screen (then `-open <screen>` lands on it). Reuses the one real
    /// login path; the password is never logged. No-op without both arguments.
    func devAutoSignIn() async {
        let store = UserDefaults.standard
        guard let email = store.string(forKey: "devEmail"), !email.isEmpty,
              let password = store.string(forKey: "devPassword"), !password.isEmpty
        else { return }
        devConfig.select(.development)
        await session.login(email: email, password: password)
    }
    #endif
}
