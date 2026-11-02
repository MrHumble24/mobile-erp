import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'config.dart';
import 'secure_storage.dart';

/// Which backend the app talks to. Switched from the dev panel.
enum AppEnv { production, development }

/// Runtime API configuration: the active environment and the base URL for each.
/// Persisted in secure storage, loaded once at startup ([loadDevConfig]).
class DevConfig {
  const DevConfig({
    required this.env,
    required this.prodUrl,
    required this.devUrl,
  });

  final AppEnv env;
  final String prodUrl;
  final String devUrl;

  /// The base URL dio should use right now.
  String get baseUrl => env == AppEnv.development ? devUrl : prodUrl;

  /// Production defaults to the build-time [AppConfig.apiUrl]; development to
  /// localhost. Both are editable in the dev panel.
  factory DevConfig.defaults() => const DevConfig(
        env: AppEnv.production,
        prodUrl: AppConfig.apiUrl,
        devUrl: 'http://localhost:3000',
      );
}

/// Reads the persisted config, falling back to defaults for anything unset.
/// Standalone so `main()` can call it before the provider scope is built.
Future<DevConfig> loadDevConfig([FlutterSecureStorage? storage]) async {
  final s = storage ?? buildSecureStorage();
  final d = DevConfig.defaults();
  final prod = await s.read(key: SecureKeys.devUrlProd);
  final dev = await s.read(key: SecureKeys.devUrlDev);
  final env = await s.read(key: SecureKeys.devEnv);
  return DevConfig(
    env: env == 'development' ? AppEnv.development : AppEnv.production,
    prodUrl: (prod != null && prod.isNotEmpty) ? prod : d.prodUrl,
    devUrl: (dev != null && dev.isNotEmpty) ? dev : d.devUrl,
  );
}

/// Startup value, overridden in `main()` with the persisted config.
final initialDevConfigProvider = Provider<DevConfig>((_) => DevConfig.defaults());

final devConfigProvider =
    NotifierProvider<DevConfigController, DevConfig>(DevConfigController.new);

class DevConfigController extends Notifier<DevConfig> {
  @override
  DevConfig build() => ref.read(initialDevConfigProvider);

  Future<void> save({
    required AppEnv env,
    required String prodUrl,
    required String devUrl,
  }) async {
    final next = DevConfig(env: env, prodUrl: prodUrl.trim(), devUrl: devUrl.trim());
    state = next; // dio rebuilds via apiBaseUrlProvider
    final s = ref.read(secureStorageProvider);
    await s.write(
      key: SecureKeys.devEnv,
      value: env == AppEnv.development ? 'development' : 'production',
    );
    await s.write(key: SecureKeys.devUrlProd, value: next.prodUrl);
    await s.write(key: SecureKeys.devUrlDev, value: next.devUrl);
  }
}

/// The live API base URL. `dioProvider` watches this, so switching environments
/// in the dev panel rebuilds the HTTP client with the new base — no restart.
final apiBaseUrlProvider =
    Provider<String>((ref) => ref.watch(devConfigProvider).baseUrl);
