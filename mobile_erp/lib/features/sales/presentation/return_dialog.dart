import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/sync/connectivity.dart';
import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/sales_providers.dart';
import '../application/warranty_controller.dart';
import '../data/sales_repository.dart';

/// Opens the process-return dialog for [saleId]. Returns are ONLINE-ONLY (not
/// one of the 4 offline mutation types), so the dialog blocks when offline.
Future<void> showReturnDialog(BuildContext context, String saleId) =>
    showDialog<void>(
      context: context,
      builder: (_) => _ReturnDialog(saleId: saleId),
    );

class _ReturnDialog extends ConsumerStatefulWidget {
  const _ReturnDialog({required this.saleId});
  final String saleId;

  @override
  ConsumerState<_ReturnDialog> createState() => _ReturnDialogState();
}

class _ReturnDialogState extends ConsumerState<_ReturnDialog> {
  final _formKey = GlobalKey<FormState>();
  final _refund = TextEditingController();
  final _reason = TextEditingController();
  String _condition = 'IN_STOCK';
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _refund.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    final online = ref.read(connectivityProvider).valueOrNull ?? true;
    if (!online) {
      setState(() => _error = context.t('common.offline'));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(salesRepositoryProvider).processReturn(
            widget.saleId,
            refundAmount: parseMoney(_refund.text).toDouble(),
            deviceToStatusCode: _condition,
            reason: _reason.text.trim(),
          );
      ref.invalidate(salesListProvider);
      ref.read(warrantyControllerProvider.notifier).clear();
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.t('sales.returnSuccess'))),
      );
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(context.t('sales.returnDevice')),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppFormField(
                label: context.t('sales.refundAmount'),
                controller: _refund,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                enabled: !_busy,
                validator: (v) => parseMoney(v).toDouble() < 0
                    ? context.t('common.required')
                    : null,
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('sales.returnReason'),
                controller: _reason,
                enabled: !_busy,
              ),
              const SizedBox(height: 12),
              Text(context.t('sales.returnCondition'),
                  style: Theme.of(context).textTheme.labelLarge),
              RadioGroup<String>(
                groupValue: _condition,
                onChanged: (v) {
                  if (!_busy) setState(() => _condition = v ?? _condition);
                },
                child: Column(
                  children: [
                    RadioListTile<String>(
                      value: 'IN_STOCK',
                      title: Text(context.t('sales.returnToStock')),
                    ),
                    RadioListTile<String>(
                      value: 'DEFECTIVE',
                      title: Text(context.t('sales.returnToDefective')),
                    ),
                  ],
                ),
              ),
              if (_error != null)
                Text(_error!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error)),
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
          onPressed: _busy ? null : _submit,
          child: Text(context.t('sales.returnDevice')),
        ),
      ],
    );
  }
}
