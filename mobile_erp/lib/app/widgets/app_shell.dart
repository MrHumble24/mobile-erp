import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/sync/connectivity.dart';
import '../../features/auth/application/permissions.dart';
import '../../features/auth/application/session_controller.dart';
import '../../l10n/i18n.dart';
import '../../shared/ui/app_dialog.dart';
import '../router/feature_registry.dart';
import '../router/nav_item.dart';

/// Adaptive navigation chrome around every authenticated route: a
/// [NavigationRail] on wide layouts (≥ 800px) and a [NavigationBar] on narrow.
/// Nav entries come from [appNavItems], filtered by the user's permissions.
/// With fewer than two visible entries it falls back to a plain app bar so the
/// first waves (no nav yet) still run.
class AppShell extends ConsumerWidget {
  const AppShell({required this.child, super.key});

  static const double _wideBreakpoint = 800;

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    final items = [
      for (final item in appNavItems)
        if (item.permission == null || can(item.permission!)) item,
    ];
    final location = GoRouterState.of(context).uri.path;

    if (items.length < 2) {
      return Scaffold(
        appBar: _AppBar(ref: ref),
        body: child,
      );
    }

    final wide = MediaQuery.sizeOf(context).width >= _wideBreakpoint;
    final selected = _selectedIndex(items, location);

    void go(int i) => context.go(items[i].route);

    if (wide) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: selected,
              onDestinationSelected: go,
              labelType: NavigationRailLabelType.all,
              destinations: [
                for (final item in items)
                  NavigationRailDestination(
                    icon: Icon(item.icon),
                    label: Text(context.t(item.labelKey)),
                  ),
              ],
              trailing: Expanded(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: _LogoutButton(ref: ref),
                ),
              ),
            ),
            const VerticalDivider(width: 1),
            Expanded(
              child: Scaffold(appBar: _AppBar(ref: ref), body: child),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: _AppBar(ref: ref),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected,
        onDestinationSelected: go,
        destinations: [
          for (final item in items)
            NavigationDestination(
              icon: Icon(item.icon),
              label: context.t(item.labelKey),
            ),
        ],
      ),
    );
  }

  int _selectedIndex(List<NavItem> items, String location) {
    final i = items.indexWhere((e) => location.startsWith(e.route));
    return i < 0 ? 0 : i;
  }
}

class _AppBar extends StatelessWidget implements PreferredSizeWidget {
  const _AppBar({required this.ref});
  final WidgetRef ref;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;
    return AppBar(
      title: const Text('Malika Bazaar'),
      actions: [
        if (!online)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Icon(Icons.cloud_off, size: 18),
                const SizedBox(width: 6),
                Text(context.t('common.offline')),
              ],
            ),
          ),
        _LogoutButton(ref: ref),
      ],
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.ref});
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: context.t('auth.logout'),
      icon: const Icon(Icons.logout),
      onPressed: () async {
        final ok = await showAppDialog(
          context,
          title: context.t('auth.logoutConfirmTitle'),
          message: context.t('auth.logoutConfirmDescription'),
          confirmLabel: context.t('auth.logout'),
          cancelLabel: context.t('common.cancel'),
          destructive: true,
        );
        if (ok == true) {
          await ref.read(sessionControllerProvider.notifier).logout();
        }
      },
    );
  }
}
