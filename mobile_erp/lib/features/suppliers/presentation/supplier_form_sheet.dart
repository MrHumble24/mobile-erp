import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../data/supplier.dart';
import '../data/suppliers_repository.dart';
import 'online_guard.dart';

/// Create or edit a supplier. Opens as a bottom sheet; invalidates
/// [suppliersProvider] on success. Writes are gated on connectivity.
Future<void> showSupplierFormSheet(
  BuildContext context, {
  Supplier? existing,
}) {
  return showAppBottomSheet<void>(
    context,
    builder: (_) => _SupplierForm(existing: existing),
  );
}

class _SupplierForm extends ConsumerStatefulWidget {
  const _SupplierForm({this.existing});
  final Supplier? existing;

  @override
  ConsumerState<_SupplierForm> createState() => _SupplierFormState();
}

class _SupplierFormState extends ConsumerState<_SupplierForm> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.existing?.name);
  late final _country = TextEditingController(text: widget.existing?.country);
  late final _contact = TextEditingController(text: widget.existing?.contact);
  late final _notes = TextEditingController(text: widget.existing?.notes);
  late bool _active = widget.existing?.isActive ?? true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _country.dispose();
    _contact.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    if (!ensureOnline(ref, context)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'name': _name.text.trim(),
      'country': _country.text.trim().isEmpty ? null : _country.text.trim(),
      'contact': _contact.text.trim().isEmpty ? null : _contact.text.trim(),
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      if (widget.existing != null) 'isActive': _active,
    };
    final repo = ref.read(suppliersRepositoryProvider);
    try {
      if (widget.existing == null) {
        await repo.create(body);
      } else {
        await repo.update(widget.existing!.id, body);
      }
      ref.invalidate(suppliersProvider);
      if (mounted) Navigator.of(context).pop();
    } on AppException catch (e) {
      setState(() => _error = e.statusCode == 409
          ? context.t('shipments.supplierDuplicate')
          : e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.existing != null;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.t(editing ? 'shipments.editSupplier' : 'shipments.newSupplier'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            AppFormField(
              label: context.t('shipments.supplierName'),
              controller: _name,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? context.t('common.required')
                  : null,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('shipments.supplierCountry'),
              controller: _country,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('shipments.supplierContact'),
              controller: _contact,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('common.notes'),
              controller: _notes,
            ),
            if (editing) ...[
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.t('shipments.supplierActive')),
                value: _active,
                onChanged: (v) => setState(() => _active = v),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
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
