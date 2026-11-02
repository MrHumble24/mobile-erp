import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/partner_providers.dart';

/// Create-partner form (online-only write). Blocks with an offline message when
/// there is no connection.
Future<void> showCreatePartnerDialog(BuildContext context) => showDialog<void>(
      context: context,
      builder: (_) => const Dialog(child: _CreatePartnerForm()),
    );

class _CreatePartnerForm extends ConsumerStatefulWidget {
  const _CreatePartnerForm();

  @override
  ConsumerState<_CreatePartnerForm> createState() => _CreatePartnerFormState();
}

class _CreatePartnerFormState extends ConsumerState<_CreatePartnerForm> {
  final _formKey = GlobalKey<FormState>();
  final _shopName = TextEditingController();
  final _contact = TextEditingController();
  final _phone = TextEditingController();
  final _creditLimit = TextEditingController(text: '0');
  final _notes = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_shopName, _contact, _phone, _creditLimit, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _opt(TextEditingController c) =>
      c.text.trim().isEmpty ? null : c.text.trim();

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(partnerActionsProvider).create({
        'shopName': _shopName.text.trim(),
        if (_opt(_contact) != null) 'contactPerson': _opt(_contact),
        if (_opt(_phone) != null) 'phone': _opt(_phone),
        'creditLimit': num.tryParse(_creditLimit.text.trim()) ?? 0,
        if (_opt(_notes) != null) 'notes': _opt(_notes),
      });
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.t('common.success'))),
      );
    } on AppException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_errorText(context, e))),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(context.t('partners.newPartner'),
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            AppFormField(
              label: context.t('partners.name'),
              controller: _shopName,
              enabled: !_busy,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? context.t('common.required')
                  : null,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('partners.contactPerson'),
              controller: _contact,
              enabled: !_busy,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('partners.phone'),
              controller: _phone,
              keyboardType: TextInputType.phone,
              enabled: !_busy,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('partners.creditLimit'),
              controller: _creditLimit,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              enabled: !_busy,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('common.notes'),
              controller: _notes,
              enabled: !_busy,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(context.t('common.create')),
            ),
          ],
        ),
      ),
    );
  }
}

String _errorText(BuildContext context, AppException e) =>
    e.isNetwork ? context.t('common.offline') : e.message;
