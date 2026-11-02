import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/consignment_providers.dart';
import '../application/consignment_writer.dart';
import '../data/consignment_models.dart';
import 'consignment_feedback.dart';

/// Settle a consignment (sale). Defaults the price to the agreed price; the
/// write is online → REST, offline → outbox (payload carries `consignmentId`).
Future<void> showSettleDialog(BuildContext context, ConsignmentView item) =>
    showDialog<void>(
      context: context,
      builder: (_) => Dialog(child: _SettleForm(item: item)),
    );

class _SettleForm extends ConsumerStatefulWidget {
  const _SettleForm({required this.item});
  final ConsignmentView item;

  @override
  ConsumerState<_SettleForm> createState() => _SettleFormState();
}

class _SettleFormState extends ConsumerState<_SettleForm> {
  late final _price =
      TextEditingController(text: widget.item.agreedPrice);
  final _notes = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _price.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (parseMoney(_price.text) <= parseMoney('0')) return;
    setState(() => _busy = true);
    try {
      final queued = await ref.read(consignmentWriterProvider).settle(
            consignmentId: widget.item.id,
            imei: widget.item.imei,
            salePrice: num.parse(_price.text.trim()),
            notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
          );
      if (!mounted) return;
      refreshConsignments(ref);
      Navigator.of(context).pop();
      showConsignmentResult(context,
          queued: queued, successKey: 'consignments.settleSuccess');
    } on AppException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('consignments.settle'),
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text('IMEI: ${widget.item.imei}',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          AppFormField(
            label: context.t('consignments.settlePrice'),
            controller: _price,
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
            child: Text(context.t('consignments.settle')),
          ),
        ],
      ),
    );
  }
}
