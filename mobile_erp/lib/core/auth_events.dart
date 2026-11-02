import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Cross-layer channel for "the server rejected our token" (401).
///
/// `core` owns the dio interceptor but must not import `features/auth`.
/// Instead it bumps [unauthorized]; the session controller listens and clears
/// the session, and the router uses it as a `refreshListenable`.
class AuthEvents {
  /// Increments once per 401. Value is meaningless — only changes matter.
  final ValueNotifier<int> unauthorized = ValueNotifier(0);

  void signalUnauthorized() => unauthorized.value++;
}

final authEventsProvider = Provider<AuthEvents>((ref) {
  final events = AuthEvents();
  ref.onDispose(events.unauthorized.dispose);
  return events;
});
