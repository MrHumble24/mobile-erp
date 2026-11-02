import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../suppliers/suppliers_module.dart';
import '../data/device_models_repository.dart';
import '../data/devices_repository.dart';
import '../data/intake_draft.dart';
import '../data/shipment.dart';
import '../data/shipments_repository.dart';
import 'intake_device_form.dart';

/// Loop-add devices to [shipment], then POST the batch. Online-only.
Future<void> showIntakeSheet(BuildContext context, Shipment shipment) {
  return showAppBottomSheet<void>(
    context,
    builder: (_) => _IntakeSheet(shipment: shipment),
  );
}

class _IntakeSheet extends ConsumerStatefulWidget {
  const _IntakeSheet({required this.shipment});
  final Shipment shipment;

  @override
  ConsumerState<_IntakeSheet> createState() => _IntakeSheetState();
}

class _IntakeSheetState extends ConsumerState<_IntakeSheet> {
  final _drafts = <IntakeDraft>[];
  bool _busy = false;
  String? _error;

  void _add(IntakeDraft draft) {
    if (_drafts.any((d) => d.imei == draft.imei)) {
      setState(() => _error = context.t('shipments.duplicateImei'));
      return;
    }
    setState(() {
      _drafts.add(draft);
      _error = null;
    });
  }

  Future<void> _submit() async {
    if (_drafts.isEmpty) return;
    if (!ensureOnline(ref, context)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(shipmentsRepositoryProvider).addDevices(
            widget.shipment.id,
            _drafts.map((d) => d.toJson()).toList(),
          );
      ref.invalidate(shipmentsProvider);
      ref.invalidate(deviceQueryProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.t('shipments.batchComplete'))),
        );
        Navigator.of(context).pop();
      }
    } on AppException catch (e) {
      setState(() => _error =
          e.statusCode == 409 ? context.t('shipments.duplicateImei') : e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final models = ref.watch(deviceModelsProvider);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('shipments.intakeDevices'),
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            context.t('shipments.registeredProgress', {
              'registered': _drafts.length,
              'expected': widget.shipment.expectedCount,
            }),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          models.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Loading(),
            ),
            error: (e, _) => ErrorView(message: '$e'),
            data: (list) => IntakeDeviceForm(models: list, onAdd: _add),
          ),
          if (_drafts.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(context.t('shipments.deviceList'),
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (var i = 0; i < _drafts.length; i++)
              _DraftRow(
                draft: _drafts[i],
                onRemove: () => setState(() => _drafts.removeAt(i)),
              ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _busy || _drafts.isEmpty ? null : _submit,
            child: Text(context.t(_busy ? 'common.loading' : 'shipments.submitBatch')),
          ),
        ],
      ),
    );
  }
}

class _DraftRow extends StatelessWidget {
  const _DraftRow({required this.draft, required this.onRemove});
  final IntakeDraft draft;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      title: Text(draft.imei,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
      subtitle: Text(draft.specs.values.join(' · ')),
      trailing: IconButton(
        icon: const Icon(Icons.close),
        onPressed: onRemove,
      ),
    );
  }
}
