import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/sync/connectivity.dart';
import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/users_controllers.dart';
import '../feedback.dart';

/// Opens the create-role form. Code is forced UPPER_SNAKE. Online-only write.
Future<void> showCreateRoleDialog(BuildContext context) => showDialog<void>(
      context: context,
      builder: (_) => const _CreateRoleDialog(),
    );

class _CreateRoleDialog extends ConsumerStatefulWidget {
  const _CreateRoleDialog();

  @override
  ConsumerState<_CreateRoleDialog> createState() => _CreateRoleDialogState();
}

class _CreateRoleDialogState extends ConsumerState<_CreateRoleDialog> {
  final _formKey = GlobalKey<FormState>();
  final _code = TextEditingController();
  final _name = TextEditingController();
  final _description = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _code.dispose();
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(rolesControllerProvider.notifier).create(
            code: _code.text.trim().toUpperCase(),
            name: _name.text.trim(),
            description: _description.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      showSuccess(context, context.t('users.roleSaved'));
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;
    return AlertDialog(
      title: Text(context.t('users.newRole')),
      content: SizedBox(
        width: 400,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppFormField(
                label: context.t('users.roleCode'),
                controller: _code,
                hintText: 'CASHIER',
                enabled: !_busy,
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? context.t('common.required')
                    : null,
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('users.roleName'),
                controller: _name,
                enabled: !_busy,
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? context.t('common.required')
                    : null,
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('users.description'),
                controller: _description,
                enabled: !_busy,
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
          onPressed: (_busy || !online) ? null : _submit,
          child: Text(context.t('common.create')),
        ),
      ],
    );
  }
}
