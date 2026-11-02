import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The one configured [FlutterSecureStorage]. Holds the 12h JWT, the cached
/// user, and the persisted terminal id. Everything secret goes through here.
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

/// Stable keys used across the app. One place so nothing drifts.
class SecureKeys {
  SecureKeys._();
  static const token = 'auth_token';
  static const user = 'auth_user';
  static const terminalId = 'terminal_id';
}
