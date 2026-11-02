import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/consignment_providers.dart';
import '../application/consignment_writer.dart';
import 'consignment_feedback.dart';

/// Consign a device: scan the IMEI, pick a partner, set price + due date, then
/// create (online → REST, offline → outbox).
Future<void> showConsignDeviceDialog(BuildContext context) => showDialog<void>(
      context: context,
      builder: (_) => const Dialog(child: _ConsignForm()),
    );

class _ConsignForm extends ConsumerStatefulWidget {
  const _ConsignForm();

  @override
  ConsumerState<_ConsignForm> createState() => _ConsignFormState();
}

class _ConsignFormState extends ConsumerState<_ConsignForm> {
  String _imei = '';
  String? _partnerId;
  final _price = TextEditingController();
  final _notes = TextEditingController();
  DateTime? _dueDate;
  bool _busy = false;

  @override
  void dispose() {
    _price.dispose();
    _notes.dispose();
    super.dispose();
  }

  bool get _valid =>
      _imei.length == 15 &&
      _partnerId != null &&
      parseMoney(_price.text) > parseMoney('0') &&
      _dueDate != null;

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365 * 2)),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  Future<void> _submit() async {
    if (!_valid) return;
    setState(() => _busy = true);
    try {
      final queued = await ref.read(consignmentWriterProvider).create(
            imei: _imei,
            partnerId: _partnerId!,
            agreedPrice: num.parse(_price.text.trim()),
            dueDate: _dueDate!,
            notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
          );
      if (!mounted) return;
      refreshConsignments(ref);
      Navigator.of(context).pop();
      showConsignmentResult(context,
          queued: queued, successKey: 'consignments.consignSuccess');
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
    final partners = ref.watch(consignPartnersProvider).valueOrNull ?? const [];
    return Padding(
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(context.t('consignments.newConsignment'),
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            Text(context.t('consignments.device'),
                style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 6),
            ScannerField(
              hintText: context.t('consignments.device'),
              autofocus: false,
              onScan: (code) => setState(() => _imei = code),
            ),
            if (_imei.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(_imei,
                    style: Theme.of(context).textTheme.bodySmall),
              ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _partnerId,
              decoration: InputDecoration(
                labelText: context.t('consignments.partner'),
                hintText: context.t('consignments.selectPartner'),
              ),
              items: [
                for (final p in partners)
                  DropdownMenuItem(value: p.id, child: Text(p.shopName)),
              ],
              onChanged: _busy ? null : (v) => setState(() => _partnerId = v),
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('consignments.agreedPrice'),
              controller: _price,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              enabled: !_busy,
            ),
            const SizedBox(height: 12),
            _DueDateField(date: _dueDate, onTap: _busy ? null : _pickDate),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('common.notes'),
              controller: _notes,
              enabled: !_busy,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy || !_valid ? null : _submit,
              child: Text(context.t('consignments.newConsignment')),
            ),
          ],
        ),
      ),
    );
  }
}

class _DueDateField extends StatelessWidget {
  const _DueDateField({required this.date, required this.onTap});

  final DateTime? date;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final label =
        date == null ? context.t('common.select') : '${date!.toLocal()}'.split(' ').first;
    return InputDecorator(
      decoration: InputDecoration(labelText: context.t('consignments.dueDate')),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [Text(label), const Icon(Icons.calendar_today, size: 18)],
          ),
        ),
      ),
    );
  }
}
