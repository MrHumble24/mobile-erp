import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/users_controllers.dart';
import '../../data/access_models.dart';
import '../dialogs/create_role_dialog.dart';
import '../dialogs/role_permissions_sheet.dart';

/// Roles tab: list roles, create a role, and edit a role's permission set.
class RolesTab extends ConsumerWidget {
  const RolesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(rolesControllerProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showCreateRoleDialog(context),
        icon: const Icon(Icons.add),
        label: Text(context.t('users.newRole')),
      ),
      body: roles.when(
        loading: () => const Loading(),
        error: (e, _) => ErrorView(
          message: '$e',
          retryLabel: context.t('common.retry'),
          onRetry: () => ref.invalidate(rolesControllerProvider),
        ),
        data: (list) => list.isEmpty
            ? EmptyView(message: context.t('common.notFound'))
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _RoleCard(role: list[i]),
              ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.role});
  final RoleView role;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return AppCard(
      onTap: role.isSystem ? null : () => showRolePermissionsSheet(context, role),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(role.name, style: text.titleMedium),
                    const SizedBox(width: 8),
                    Text(role.code, style: text.bodySmall),
                  ],
                ),
                if (role.description != null && role.description!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(role.description!, style: text.bodySmall),
                ],
                const SizedBox(height: 8),
                Text('${role.permissionCodes.length}',
                    style: text.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: 12),
          if (role.isSystem)
            StatusChip('system', color: AppColors.ash)
          else
            const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
