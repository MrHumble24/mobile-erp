import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/sync/connectivity.dart';
import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/users_controllers.dart';
import '../feedback.dart';
import 'role_checkboxes.dart';

/// Opens the create-user form in a dialog. Online-only write.
Future<void> showCreateUserDialog(BuildContext context) => showDialog<void>(
      context: context,
      builder: (_) => const _CreateUserDialog(),
    );

class _CreateUserDialog extends ConsumerStatefulWidget {
  const _CreateUserDialog();

  @override
  ConsumerState<_CreateUserDialog> createState() => _CreateUserDialogState();
}

class _CreateUserDialogState extends ConsumerState<_CreateUserDialog> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _roles = <String>{};
  bool _busy = false;

  @override
  void dispose() {
    _firstName.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(usersControllerProvider.notifier).create(
            email: _email.text.trim(),
            password: _password.text,
            profile: {
              'firstName': _firstName.text.trim(),
              if (_phone.text.trim().isNotEmpty) 'phone': _phone.text.trim(),
            },
            roleCodes: _roles.toList(),
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      showSuccess(context, context.t('users.userSaved'));
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
      title: Text(context.t('users.newUser')),
      content: SizedBox(
        width: 400,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppFormField(
                  label: context.t('users.fullName'),
                  controller: _firstName,
                  enabled: !_busy,
                  validator: _required,
                ),
                const SizedBox(height: 12),
                AppFormField(
                  label: context.t('common.phone'),
                  controller: _phone,
                  hintText: '+99890...',
                  keyboardType: TextInputType.phone,
                  enabled: !_busy,
                ),
                const SizedBox(height: 12),
                AppFormField(
                  label: context.t('users.email'),
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  enabled: !_busy,
                  validator: _required,
                ),
                const SizedBox(height: 12),
                AppFormField(
                  label: context.t('users.password'),
                  controller: _password,
                  obscureText: true,
                  enabled: !_busy,
                  validator: (v) => (v == null || v.length < 8)
                      ? context.t('common.required')
                      : null,
                ),
                const SizedBox(height: 16),
                RoleCheckboxes(
                  selected: _roles,
                  onToggle: (code) => setState(() =>
                      _roles.contains(code) ? _roles.remove(code) : _roles.add(code)),
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

  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? context.t('common.required') : null;
}
