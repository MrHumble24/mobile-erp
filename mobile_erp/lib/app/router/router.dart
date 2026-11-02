import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth_events.dart';
import '../../features/auth/application/session_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../home_screen.dart';
import '../widgets/app_shell.dart';
import 'feature_registry.dart';

/// The app router. One `redirect` enforces auth (unauthenticated → `/login`,
/// authenticated-at-login → `/`); per-route permission is enforced inline by
/// `PermissionGate` on the feature screens. Refreshes on session changes and
/// on a 401 from [AuthEvents].
final goRouterProvider = Provider<GoRouter>((ref) {
  final events = ref.watch(authEventsProvider);
  final refresh = _Refresh();
  ref.listen(sessionControllerProvider, (_, _) => refresh.bump());
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: kDebugMode,
    refreshListenable: Listenable.merge([refresh, events.unauthorized]),
    redirect: (context, state) {
      final session = ref.read(sessionControllerProvider);
      if (session.isLoading) return null; // wait for persisted session load
      final loggedIn = session.valueOrNull != null;
      final atLogin = state.matchedLocation == '/login';
      if (!loggedIn) return atLogin ? null : '/login';
      if (atLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      ShellRoute(
        builder: (_, _, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
          ...featureRoutes,
        ],
      ),
    ],
  );
});

/// Minimal [Listenable] bridge so go_router re-runs `redirect` when the session
/// changes (login/logout), not only on 401.
class _Refresh extends ChangeNotifier {
  void bump() => notifyListeners();
}
