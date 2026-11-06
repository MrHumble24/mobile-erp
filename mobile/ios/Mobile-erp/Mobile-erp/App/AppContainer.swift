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
    let storeManager: StoreManager

    var modelContext: ModelContext { modelContainer.mainContext }
    var outbox: Outbox {
        Outbox(context: modelContext, storeIDProvider: { [weak self] in self?.storeManager.activeStoreID })
    }
    func conflicts() -> ConflictStore { ConflictStore(api: api) }

    init() {
        let keychain = Keychain()
        let devConfig = DevConfig.load()
        let storeManager = StoreManager(keychain: keychain)
        self.devConfig = devConfig
        self.i18n = I18n()
        self.connectivity = Connectivity()
        self.terminalID = TerminalID.load(keychain)
        self.storeManager = storeManager

        // SwiftData store; fall back to in-memory if the on-disk store can't open
        // (e.g. an incompatible older schema on a dev device) so the app still runs.
        let schema = Schema(LocalSchema.models)
        self.modelContainer = (try? ModelContainer(for: schema))
            ?? (try! ModelContainer(
                for: schema,
                configurations: ModelConfiguration(isStoredInMemoryOnly: true)))

        let api = APIClient(
            baseURL: { devConfig.baseURL },
            token: { keychain.string(.token) },
            storeID: { storeManager.activeStoreID }
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

        // Cross-wire the runtime edges now that every part exists.
        let flags = storeFlags
        api.onUnauthorized = { [weak session, weak storeManager] in
            storeManager?.clear()
            session?.clear()
        }
        api.onStoreRequired = { [weak self] in
            guard let self else { return }
            self.storeManager.clear()
            self.toasts.error(self.i18n.t("stores.storeRequired"))
        }
        api.onStoreForbidden = { [weak self] in
            guard let self else { return }
            self.storeManager.clear()
            self.toasts.error(self.i18n.t("stores.storeForbidden"))
            Task { await self.session.refreshUser() }
        }
        session.onLogin = { [weak self] in
            guard let self else { return }
            self.storeManager.sync(with: self.session.user)
            self.sync.syncNow()
            Task { await flags.refresh(api: self.api) }
        }
        connectivity.onReconnect = { sync.syncNow() } // regain network → sync
    }

    /// Handles store switching according to Item 4.
    func switchStore(_ newStoreID: String) async {
        // 1. save the new store
        storeManager.setActiveStoreID(newStoreID)
        // 2. clear every list the app keeps in memory
        URLCache.shared.removeAllCachedResponses()
        // 3. delete the offline copies of devices and products
        // 4. reset the sync position
        let pull = PullService(api: api, context: modelContext)
        pull.clearOfflineCopies()
        pull.resetCursor()
        // 5. pull again
        try? await pull.pull()
    }

    /// Called once from the root view on appear: sync if already online + signed in.
    func bootstrap() {
        #if DEBUG
        runDebugSelfChecks()
        KitSelfCheck.run()
        #endif
        storeManager.sync(with: session.user)
        if let user = session.user, user.stores.isEmpty {
            Task { await session.refreshUser() }
        }
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
