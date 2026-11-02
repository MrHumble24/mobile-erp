import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/users_controllers.dart';
import '../../data/access_models.dart';
import '../feedback.dart';

/// Checkbox grid of every permission (grouped by resource) for one role,
/// preselected with the role's current codes. Save replaces the role's set.
Future<void> showRolePermissionsSheet(BuildContext context, RoleView role) =>
    showAppBottomSheet<void>(
      context,
      builder: (_) => _RolePermissionsEditor(role: role),
    );

class _RolePermissionsEditor extends ConsumerStatefulWidget {
  const _RolePermissionsEditor({required this.role});
  final RoleView role;

  @override
  ConsumerState<_RolePermissionsEditor> createState() =>
      _RolePermissionsEditorState();
}

class _RolePermissionsEditorState
    extends ConsumerState<_RolePermissionsEditor> {
  late final Set<String> _selected = widget.role.permissionCodes.toSet();
  bool _busy = false;

  Future<void> _save() async {
    setState(() => _busy = true);
    try {
      await ref
          .read(rolesControllerProvider.notifier)
          .setPermissions(widget.role.code, _selected.toList());
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
          Text(widget.role.name, style: text.titleMedium),
          Text(widget.role.code, style: text.bodySmall),
          const SizedBox(height: 12),
          Flexible(
            child: perms.when(
              loading: () => const Loading(),
              error: (e, _) => ErrorView(message: '$e'),
              data: (list) => ListView(
                shrinkWrap: true,
                children: [
                  for (final entry in _byResource(list).entries)
                    _ResourceGroup(
                      resource: entry.key,
                      permissions: entry.value,
                      selected: _selected,
                      onToggle: (code) => setState(() => _selected.contains(code)
                          ? _selected.remove(code)
                          : _selected.add(code)),
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

  Map<String, List<PermissionView>> _byResource(List<PermissionView> list) {
    final map = <String, List<PermissionView>>{};
    for (final p in list) {
      (map[p.resource] ??= []).add(p);
    }
    return map;
  }
}

class _ResourceGroup extends StatelessWidget {
  const _ResourceGroup({
    required this.resource,
    required this.permissions,
    required this.selected,
    required this.onToggle,
  });

  final String resource;
  final List<PermissionView> permissions;
  final Set<String> selected;
  final void Function(String code) onToggle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 4),
          child: Text(resource.toUpperCase(),
              style: Theme.of(context).textTheme.labelLarge),
        ),
        for (final p in permissions)
          CheckboxListTile(
            dense: true,
            controlAffinity: ListTileControlAffinity.leading,
            value: selected.contains(p.code),
            onChanged: (_) => onToggle(p.code),
            title: Text(p.code),
            subtitle: p.description == null ? null : Text(p.description!),
          ),
      ],
    );
  }
}
