import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../data/local/database.dart';
import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/partner_providers.dart';

/// Record a payment against a partner (perm `partner.payment`, online-only).
Future<void> showRecordPaymentDialog(BuildContext context, Partner partner) =>
    showDialog<void>(
      context: context,
      builder: (_) => Dialog(child: _RecordPaymentForm(partner: partner)),
    );

class _RecordPaymentForm extends ConsumerStatefulWidget {
  const _RecordPaymentForm({required this.partner});
  final Partner partner;

  @override
  ConsumerState<_RecordPaymentForm> createState() => _RecordPaymentFormState();
}

class _RecordPaymentFormState extends ConsumerState<_RecordPaymentForm> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(partnerActionsProvider).recordPayment(widget.partner.id, {
        'amount': num.parse(_amount.text.trim()),
        if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
      });
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.t('partners.paymentSuccess'))),
      );
    } on AppException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.isNetwork ? context.t('common.offline') : e.message)),
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
            Text(context.t('partners.recordPayment'),
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              '${widget.partner.shopName} · ${context.t('partners.outstanding')}: ${formatMoney(widget.partner.outstanding)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            AppFormField(
              label: context.t('partners.paymentAmount'),
              controller: _amount,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              enabled: !_busy,
              validator: (v) {
                final amount = parseMoney(v);
                return amount <= parseMoney('0')
                    ? context.t('common.required')
                    : null;
              },
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
              child: Text(context.t('partners.recordPayment')),
            ),
          ],
        ),
      ),
    );
  }
}
