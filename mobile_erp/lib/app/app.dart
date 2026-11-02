import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sync/sync_controller.dart';
import '../theme/app_theme.dart';
import 'router/router.dart';

/// Root widget: the Caldera theme + the go_router. Bootstraps the sync
/// controller so offline push/pull runs on connectivity changes.
class MalikaApp extends ConsumerWidget {
  const MalikaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(syncControllerProvider); // keep sync alive for the app's lifetime
    return MaterialApp.router(
      title: 'Malika Bazaar',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: ref.watch(goRouterProvider),
    );
  }
}
