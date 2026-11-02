import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/application/permissions.dart';
import 'forbidden_view.dart';

/// Wraps a screen that requires a permission code. Renders [child] when the
/// user `can(code)`, else an inline 403. Feature route builders wrap their
/// screen in this — a direct port of the web `RequirePermission`.
class PermissionGate extends ConsumerWidget {
  const PermissionGate({required this.permission, required this.child, super.key});

  final String permission;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final can = ref.watch(canProvider);
    return can(permission) ? child : const ForbiddenView();
  }
}
