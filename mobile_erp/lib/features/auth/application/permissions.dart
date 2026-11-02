import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'session_controller.dart';

/// The signed-in user's effective permission codes (empty when logged out).
final permissionsProvider = Provider<Set<String>>((ref) {
  final user = ref.watch(sessionControllerProvider).valueOrNull;
  return user?.permissions.toSet() ?? const {};
});

/// `ref.watch(canProvider)('device.read')` — the single permission check.
/// A direct port of the web `hasPermission`. Gating checks CODES, never roles.
final canProvider = Provider<bool Function(String code)>((ref) {
  final perms = ref.watch(permissionsProvider);
  return perms.contains;
});
