import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The one secure-storage configuration. A function (not just the provider) so
/// `main()` can load persisted config before the [ProviderScope] exists.
FlutterSecureStorage buildSecureStorage() => const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    );

/// The one configured [FlutterSecureStorage]. Holds the 12h JWT, the cached
/// user, the terminal id, and the dev-panel API config. Everything secret
/// goes through here.
final secureStorageProvider =
    Provider<FlutterSecureStorage>((ref) => buildSecureStorage());

/// Stable keys used across the app. One place so nothing drifts.
class SecureKeys {
  SecureKeys._();
  static const token = 'auth_token';
  static const user = 'auth_user';
  static const terminalId = 'terminal_id';
  static const devEnv = 'dev_env';
  static const devUrlProd = 'dev_url_prod';
  static const devUrlDev = 'dev_url_dev';
}
