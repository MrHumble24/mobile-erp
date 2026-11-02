import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/secure_storage.dart';
import 'connectivity.dart';
import 'pull_service.dart';
import 'push_service.dart';

/// Orchestrates offline sync: push the outbox first (so local writes land),
/// then pull fresh changes. Runs automatically whenever connectivity flips to
/// online (and once at startup when already online), and on demand via [syncNow].
///
/// Bootstrapped once by the app (`ref.read(syncControllerProvider)`); feature
/// agents never edit this — they enqueue to the outbox and read the cache.
class SyncController {
  SyncController(this._ref) {
    _ref.listen<AsyncValue<bool>>(connectivityProvider, (_, next) {
      if (next.valueOrNull == true) syncNow();
    }, fireImmediately: true);
  }

  final Ref _ref;
  bool _running = false;

  Future<void> syncNow() async {
    if (_running) return; // ponytail: single-flight; drop overlapping triggers
    final token = await _ref.read(secureStorageProvider).read(key: SecureKeys.token);
    if (token == null || token.isEmpty) return; // not authenticated → skip
    _running = true;
    try {
      await _ref.read(pushServiceProvider).drain();
      await _ref.read(pullServiceProvider).pull();
    } catch (_) {
      // Offline/transient failures are expected; next online event retries.
    } finally {
      _running = false;
    }
  }
}

final syncControllerProvider = Provider<SyncController>(
  (ref) => SyncController(ref),
);
