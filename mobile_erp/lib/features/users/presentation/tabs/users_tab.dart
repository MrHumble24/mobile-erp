import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../../../theme/tokens.dart';
import '../../application/users_controllers.dart';
import '../../data/access_models.dart';
import '../dialogs/create_user_dialog.dart';
import '../dialogs/edit_user_dialog.dart';

/// Users tab: a scrollable list of users with a create button and per-row edit.
class UsersTab extends ConsumerWidget {
  const UsersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(usersControllerProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showCreateUserDialog(context),
        icon: const Icon(Icons.person_add_alt_1),
        label: Text(context.t('users.newUser')),
      ),
      body: users.when(
        loading: () => const Loading(),
        error: (e, _) => ErrorView(
          message: '$e',
          retryLabel: context.t('common.retry'),
          onRetry: () => ref.invalidate(usersControllerProvider),
        ),
        data: (list) => list.isEmpty
            ? EmptyView(message: context.t('common.notFound'))
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _UserCard(user: list[i]),
              ),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({required this.user});
  final UserView user;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return AppCard(
      onTap: () => showEditUserDialog(context, user),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.profile?.fullName.trim().isNotEmpty == true
                      ? user.profile!.fullName
                      : user.email,
                  style: text.titleMedium,
                ),
                const SizedBox(height: 2),
                Text(user.email, style: text.bodySmall),
                if (user.roles.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      for (final r in user.roles)
                        StatusChip(r, color: AppColors.ash),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          StatusChip(
            user.isActive ? context.t('common.yes') : context.t('common.no'),
            color: user.isActive ? AppColors.success : AppColors.danger,
          ),
        ],
      ),
    );
  }
}
