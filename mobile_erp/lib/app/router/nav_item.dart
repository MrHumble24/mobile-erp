import 'package:flutter/widgets.dart';

/// One entry in the app's navigation. Features declare their own in
/// `features/<slice>/<slice>_module.dart` and register them in
/// `feature_registry.dart`. The shell renders items the user `can()` see.
class NavItem {
  const NavItem({
    required this.route,
    required this.labelKey,
    required this.icon,
    this.permission,
  });

  /// go_router path, e.g. `/inventory`.
  final String route;

  /// i18n key, e.g. `nav.inventory`.
  final String labelKey;

  final IconData icon;

  /// Permission code required to see/enter this section; null = always.
  final String? permission;
}
