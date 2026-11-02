import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/consignment_providers.dart';
import '../application/consignment_writer.dart';
import '../data/consignment_models.dart';
import 'consignment_feedback.dart';

/// Return a consigned device to stock. Online → REST, offline → outbox (payload
/// carries `consignmentId`).
Future<void> showReturnDialog(BuildContext context, ConsignmentView item) =>
    showDialog<void>(
      context: context,
      builder: (_) => Dialog(child: _ReturnForm(item: item)),
    );

class _ReturnForm extends ConsumerStatefulWidget {
  const _ReturnForm({required this.item});
  final ConsignmentView item;

  @override
  ConsumerState<_ReturnForm> createState() => _ReturnFormState();
}

class _ReturnFormState extends ConsumerState<_ReturnForm> {
  final _reason = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      final queued = await ref.read(consignmentWriterProvider).returnToStock(
            consignmentId: widget.item.id,
            imei: widget.item.imei,
            reason: _reason.text.trim().isEmpty ? null : _reason.text.trim(),
          );
      if (!mounted) return;
      refreshConsignments(ref);
      Navigator.of(context).pop();
      showConsignmentResult(context,
          queued: queued, successKey: 'consignments.returnSuccess');
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
          Text(context.t('consignments.return'),
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text('IMEI: ${widget.item.imei}',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          AppFormField(
            label: context.t('consignments.returnReason'),
            controller: _reason,
            enabled: !_busy,
          ),
          const SizedBox(height: 20),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: _busy ? null : _submit,
            child: Text(context.t('consignments.return')),
          ),
        ],
      ),
    );
  }
}
