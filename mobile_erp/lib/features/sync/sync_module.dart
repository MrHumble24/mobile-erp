import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/nav_item.dart';
import 'presentation/sync_screen.dart';

/// Sync slice wiring. Registered in `app/router/feature_registry.dart`:
///   import 'package:mobile_erp/features/sync/sync_module.dart';
///   ...syncRoutes    →  featureRoutes
///   ...syncNavItems  →  appNavItems
///
/// Visible to every signed-in user (they can see their own offline queue); the
/// conflict-resolution section inside is gated by `sync.resolve`.
List<RouteBase> syncRoutes = [
  GoRoute(path: '/sync', builder: (_, _) => const SyncScreen()),
];

List<NavItem> syncNavItems = const [
  NavItem(route: '/sync', labelKey: 'nav.sync', icon: Icons.sync),
];
