import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/users_controllers.dart';
import '../../data/access_models.dart';
import '../feedback.dart';

/// Per-user permission overrides editor. The server `PUT /users/:id/permissions`
/// REPLACES the whole override set, and the user projection does not return the
/// current overrides — so each permission starts at "default" (no override) and
/// only the explicit grant/revoke choices are submitted.
Future<void> showUserOverridesSheet(BuildContext context, UserView user) =>
    showAppBottomSheet<void>(
      context,
      builder: (_) => _OverridesEditor(user: user),
    );

/// null = no override, true = grant, false = revoke.
enum _Choice { grant, revoke }

class _OverridesEditor extends ConsumerStatefulWidget {
  const _OverridesEditor({required this.user});
  final UserView user;

  @override
  ConsumerState<_OverridesEditor> createState() => _OverridesEditorState();
}

class _OverridesEditorState extends ConsumerState<_OverridesEditor> {
  final _choices = <String, _Choice>{};
  bool _busy = false;

  Future<void> _save() async {
    setState(() => _busy = true);
    final overrides = [
      for (final e in _choices.entries)
        PermissionOverride(
            permissionCode: e.key, granted: e.value == _Choice.grant),
    ];
    try {
      await ref
          .read(usersControllerProvider.notifier)
          .setPermissions(widget.user.id, overrides);
      if (!mounted) return;
      Navigator.of(context).pop();
      showSuccess(context, context.t('users.matrixSaved'));
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final perms = ref.watch(permissionsListProvider);
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('users.tabPermissions'), style: text.titleMedium),
          Text(widget.user.email, style: text.bodySmall),
          const SizedBox(height: 12),
          Flexible(
            child: perms.when(
              loading: () => const Loading(),
              error: (e, _) => ErrorView(message: '$e'),
              data: (list) => ListView(
                shrinkWrap: true,
                children: [
                  for (final p in list)
                    _PermissionRow(
                      permission: p,
                      choice: _choices[p.code],
                      onChanged: (c) => setState(() {
                        if (c == null) {
                          _choices.remove(p.code);
                        } else {
                          _choices[p.code] = c;
                        }
                      }),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: Text(context.t('users.saveMatrix')),
          ),
        ],
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  const _PermissionRow({
    required this.permission,
    required this.choice,
    required this.onChanged,
  });

  final PermissionView permission;
  final _Choice? choice;
  final ValueChanged<_Choice?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(permission.code,
                style: Theme.of(context).textTheme.bodyMedium),
          ),
          const SizedBox(width: 8),
          SegmentedButton<_Choice?>(
            showSelectedIcon: false,
            // i18n keys users.overrideDefault/Grant/Revoke are missing — plain
            // English until Gemini supplies the Uzbek copy (reported in handoff).
            segments: const [
              ButtonSegment(value: null, label: Text('Default')),
              ButtonSegment(value: _Choice.grant, label: Text('Grant')),
              ButtonSegment(value: _Choice.revoke, label: Text('Revoke')),
            ],
            selected: {choice},
            onSelectionChanged: (s) => onChanged(s.first),
          ),
        ],
      ),
    );
  }
}
