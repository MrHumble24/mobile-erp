import 'package:go_router/go_router.dart';

import 'presentation/dev_panel_screen.dart';

/// Hidden developer panel. Unlike feature slices, this is NOT registered in
/// `feature_registry.dart` — it has no nav entry and mounts OUTSIDE the
/// authenticated shell (a public route, like `/login`), wired directly in
/// `app/router/router.dart`. Reachable from the login screen without signing in.
List<RouteBase> devPanelRoutes = [
  GoRoute(path: '/dev', builder: (_, _) => const DevPanelScreen()),
];
