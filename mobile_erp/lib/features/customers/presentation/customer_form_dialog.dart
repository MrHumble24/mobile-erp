import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/sync/connectivity.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/customers_providers.dart';
import '../data/customer_models.dart';

/// New-customer dialog. Creating a customer is an ONLINE-only write (no offline
/// handler), so it blocks when offline. Returns the created [Customer] or null.
Future<Customer?> showCustomerFormDialog(BuildContext context) =>
    showDialog<Customer>(
      context: context,
      builder: (_) => const _CustomerFormDialog(),
    );

class _CustomerFormDialog extends ConsumerStatefulWidget {
  const _CustomerFormDialog();

  @override
  ConsumerState<_CustomerFormDialog> createState() => _State();
}

class _State extends ConsumerState<_CustomerFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _notes = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    final online = ref.read(connectivityProvider).valueOrNull ?? true;
    if (!online) {
      setState(() => _error = context.t('common.offline'));
      return;
    }
    final created = await ref
        .read(customerCreateControllerProvider.notifier)
        .submit(
          name: _name.text.trim(),
          phone: _phone.text.trim(),
          notes: _notes.text.trim(),
        );
    if (!mounted) return;
    if (created != null) {
      Navigator.of(context).pop(created);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.t('sales.customerSaved'))),
      );
    } else {
      setState(() => _error = '${ref.read(customerCreateControllerProvider).error}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = ref.watch(customerCreateControllerProvider).isLoading;
    return AlertDialog(
      title: Text(context.t('sales.newCustomer')),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppFormField(
                label: context.t('sales.customerName'),
                controller: _name,
                enabled: !busy,
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? context.t('common.required')
                    : null,
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('sales.customerPhone'),
                controller: _phone,
                keyboardType: TextInputType.phone,
                enabled: !busy,
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('sales.customerNotes'),
                controller: _notes,
                enabled: !busy,
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: busy ? null : () => Navigator.of(context).pop(),
          child: Text(context.t('common.cancel')),
        ),
        FilledButton(
          onPressed: busy ? null : _submit,
          child: Text(context.t('common.save')),
        ),
      ],
    );
  }
}
