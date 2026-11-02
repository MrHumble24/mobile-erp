import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/users_controllers.dart';
import '../../data/access_models.dart';

/// Read-only roles × permissions grid. Rows are permissions, columns are roles;
/// a cell is checked when the role carries that permission.
class PermissionMatrixTab extends ConsumerWidget {
  const PermissionMatrixTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(rolesControllerProvider);
    final perms = ref.watch(permissionsListProvider);

    if (roles.isLoading || perms.isLoading) return const Loading();
    final error = roles.error ?? perms.error;
    if (error != null) return ErrorView(message: '$error');

    final roleList = roles.value ?? const <RoleView>[];
    final permList = perms.value ?? const <PermissionView>[];
    if (permList.isEmpty) {
      return EmptyView(message: context.t('common.notFound'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: AppDataTable<PermissionView>(
        columns: [
          context.t('users.tabPermissions'),
          for (final r in roleList) r.code,
        ],
        rows: permList,
        cells: (p) => [
          Text(p.code),
          for (final r in roleList)
            r.permissionCodes.contains(p.code)
                ? const Icon(Icons.check, size: 18, color: AppColors.success)
                : const Text('—'),
        ],
      ),
    );
  }
}
