import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/sync/connectivity.dart';
import '../../../../l10n/i18n.dart';
import '../../application/users_controllers.dart';
import '../../data/access_models.dart';
import '../feedback.dart';
import 'role_checkboxes.dart';
import 'user_overrides_sheet.dart';

/// Opens the edit-user dialog: toggle active, reassign roles, and open the
/// per-user permission overrides editor. Online-only writes.
Future<void> showEditUserDialog(BuildContext context, UserView user) =>
    showDialog<void>(
      context: context,
      builder: (_) => _EditUserDialog(user: user),
    );

class _EditUserDialog extends ConsumerStatefulWidget {
  const _EditUserDialog({required this.user});
  final UserView user;

  @override
  ConsumerState<_EditUserDialog> createState() => _EditUserDialogState();
}

class _EditUserDialogState extends ConsumerState<_EditUserDialog> {
  late bool _active = widget.user.isActive;
  late final Set<String> _roles = widget.user.roles.toSet();
  bool _busy = false;

  Future<void> _save() async {
    setState(() => _busy = true);
    final notifier = ref.read(usersControllerProvider.notifier);
    try {
      if (_active != widget.user.isActive) {
        await notifier.setActive(widget.user.id, _active);
      }
      if (!_sameRoles) {
        await notifier.setRoles(widget.user.id, _roles.toList());
      }
      if (!mounted) return;
      Navigator.of(context).pop();
      showSuccess(context, context.t('users.userSaved'));
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  bool get _sameRoles =>
      _roles.length == widget.user.roles.length &&
      _roles.containsAll(widget.user.roles);

  @override
  Widget build(BuildContext context) {
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;
    return AlertDialog(
      title: Text(context.t('users.editUser')),
      content: SizedBox(
        width: 400,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.user.email,
                  style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.t('users.isActive')),
                value: _active,
                onChanged: _busy ? null : (v) => setState(() => _active = v),
              ),
              const SizedBox(height: 8),
              RoleCheckboxes(
                selected: _roles,
                onToggle: (code) => setState(() =>
                    _roles.contains(code) ? _roles.remove(code) : _roles.add(code)),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: (_busy || !online)
                    ? null
                    : () => showUserOverridesSheet(context, widget.user),
                icon: const Icon(Icons.tune),
                label: Text(context.t('users.tabPermissions')),
              ),
              if (!online) ...[
                const SizedBox(height: 12),
                Text(context.t('common.offline'),
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.of(context).pop(),
          child: Text(context.t('common.cancel')),
        ),
        FilledButton(
          onPressed: (_busy || !online) ? null : _save,
          child: Text(context.t('common.save')),
        ),
      ],
    );
  }
}
