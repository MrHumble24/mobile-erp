import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth_events.dart';
import '../../../core/jwt.dart';
import '../../../core/secure_storage.dart';
import '../../../data/sync/sync_controller.dart';
import '../data/auth_models.dart';
import '../data/auth_repository.dart';

/// Single source of truth for the session. State is the signed-in [AuthUser],
/// or null when logged out. The token lives in secure storage (read by dio);
/// this controller persists it and the cached user, and clears both on 401.
class SessionController extends AsyncNotifier<AuthUser?> {
  @override
  Future<AuthUser?> build() async {
    final events = ref.watch(authEventsProvider);
    void onUnauthorized() => state = const AsyncData(null);
    events.unauthorized.addListener(onUnauthorized);
    ref.onDispose(() => events.unauthorized.removeListener(onUnauthorized));
    return _loadPersisted();
  }

  Future<AuthUser?> _loadPersisted() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.read(key: SecureKeys.token);
    final userJson = await storage.read(key: SecureKeys.user);
    if (token == null || token.isEmpty || userJson == null) return null;
    if (isJwtExpired(token)) return null; // expired 12h session → force re-login
    return AuthUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(authRepositoryProvider).login(email, password);
      final storage = ref.read(secureStorageProvider);
      await storage.write(key: SecureKeys.token, value: result.token);
      await storage.write(
        key: SecureKeys.user,
        value: jsonEncode(result.user.toJson()),
      );
      ref.read(syncControllerProvider).syncNow(); // hydrate the cache
      return result.user;
    });
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    await storage.delete(key: SecureKeys.token);
    await storage.delete(key: SecureKeys.user);
    state = const AsyncData(null);
  }
}

final sessionControllerProvider =
    AsyncNotifierProvider<SessionController, AuthUser?>(SessionController.new);
