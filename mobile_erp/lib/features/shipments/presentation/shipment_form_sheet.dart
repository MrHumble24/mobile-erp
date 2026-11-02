import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../suppliers/suppliers_module.dart';
import '../data/shipment.dart';
import '../data/shipments_repository.dart';

/// Create or edit a shipment. Returns the saved [Shipment] (or null if
/// cancelled) so the caller can chain into device intake. Writes gated online.
Future<Shipment?> showShipmentFormSheet(
  BuildContext context, {
  Shipment? existing,
}) {
  return showAppBottomSheet<Shipment>(
    context,
    builder: (_) => _ShipmentForm(existing: existing),
  );
}

class _ShipmentForm extends ConsumerStatefulWidget {
  const _ShipmentForm({this.existing});
  final Shipment? existing;

  @override
  ConsumerState<_ShipmentForm> createState() => _ShipmentFormState();
}

class _ShipmentFormState extends ConsumerState<_ShipmentForm> {
  final _formKey = GlobalKey<FormState>();
  String? _supplierId;
  late DateTime _date = widget.existing?.shipmentDate ?? DateTime.now();
  late final _expected = TextEditingController(
      text: widget.existing?.expectedCount.toString() ?? '');
  late final _overhead =
      TextEditingController(text: widget.existing?.overheadCost ?? '');
  late final _notes = TextEditingController(text: widget.existing?.notes);
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _supplierId = widget.existing?.supplierId;
  }

  @override
  void dispose() {
    _expected.dispose();
    _overhead.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    if (widget.existing == null && _supplierId == null) {
      setState(() => _error = context.t('shipments.selectSupplier'));
      return;
    }
    if (!ensureOnline(ref, context)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final overhead = num.tryParse(_overhead.text.trim());
    final body = <String, dynamic>{
      if (widget.existing == null) 'supplierId': _supplierId,
      'shipmentDate': _date.toIso8601String(),
      'expectedCount': int.parse(_expected.text.trim()),
      'overheadCost': ?overhead,
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
    };
    final repo = ref.read(shipmentsRepositoryProvider);
    try {
      final saved = widget.existing == null
          ? await repo.create(body)
          : await repo.update(widget.existing!.id, body);
      ref.invalidate(shipmentsProvider);
      if (mounted) Navigator.of(context).pop(saved);
    } on AppException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.existing != null;
    final suppliers =
        ref.watch(suppliersProvider).valueOrNull?.where((s) => s.isActive).toList() ??
            const [];
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.t(editing ? 'shipments.editShipment' : 'shipments.createShipment'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            if (!editing)
              DropdownButtonFormField<String>(
                initialValue: _supplierId,
                decoration: InputDecoration(
                  labelText: context.t('shipments.supplier'),
                ),
                items: [
                  for (final s in suppliers)
                    DropdownMenuItem(value: s.id, child: Text(s.name)),
                ],
                onChanged: (v) => setState(() => _supplierId = v),
              ),
            if (!editing) const SizedBox(height: 12),
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: context.t('shipments.shipmentDate'),
                ),
                child: Text(_date.toIso8601String().split('T').first),
              ),
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('shipments.expectedCount'),
              controller: _expected,
              keyboardType: TextInputType.number,
              validator: (v) => (int.tryParse(v?.trim() ?? '') ?? -1) < 0
                  ? context.t('common.required')
                  : null,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('shipments.overheadCost'),
              controller: _overhead,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('common.notes'),
              controller: _notes,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(context.t(_busy ? 'common.loading' : 'common.save')),
            ),
          ],
        ),
      ),
    );
  }
}
