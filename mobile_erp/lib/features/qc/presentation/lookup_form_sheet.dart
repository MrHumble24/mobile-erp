import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../suppliers/suppliers_module.dart' show ensureOnline;
import '../application/qc_providers.dart';
import '../data/qc_models.dart';
import '../data/qc_repository.dart';

/// Create or edit a QC lookup (`kind` = `grades` | `defect-types`). On success
/// invalidates the list providers so the grade picker / checklist refresh.
Future<void> showLookupFormSheet(
  BuildContext context, {
  required String kind,
  Lookup? existing,
}) {
  return showAppBottomSheet<void>(
    context,
    builder: (_) => _LookupForm(kind: kind, existing: existing),
  );
}

class _LookupForm extends ConsumerStatefulWidget {
  const _LookupForm({required this.kind, this.existing});
  final String kind;
  final Lookup? existing;

  @override
  ConsumerState<_LookupForm> createState() => _LookupFormState();
}

class _LookupFormState extends ConsumerState<_LookupForm> {
  final _formKey = GlobalKey<FormState>();
  late final _code = TextEditingController(text: widget.existing?.code);
  late final _label = TextEditingController(text: widget.existing?.label);
  late final _sortOrder = TextEditingController(
      text: widget.existing?.sortOrder.toString() ?? '');
  late bool _active = widget.existing?.isActive ?? true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    _label.dispose();
    _sortOrder.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    if (!ensureOnline(ref, context)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final sort = int.tryParse(_sortOrder.text.trim());
    final repo = ref.read(qcRepositoryProvider);
    try {
      if (widget.existing == null) {
        await repo.createLookup(widget.kind, {
          'code': _code.text.trim(),
          'label': _label.text.trim(),
          'sortOrder': ?sort,
        });
      } else {
        await repo.updateLookup(widget.kind, widget.existing!.code, {
          'label': _label.text.trim(),
          'sortOrder': ?sort,
          'isActive': _active,
        });
      }
      _invalidate();
      if (mounted) Navigator.of(context).pop();
    } on AppException catch (e) {
      setState(() => _error = e.statusCode == 409
          ? context.t('qc.codeDuplicate')
          : e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _invalidate() {
    ref.invalidate(lookupsProvider);
    if (widget.kind == 'grades') {
      ref.invalidate(gradesProvider);
    } else {
      ref.invalidate(defectTypesProvider);
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
              context.t(widget.kind == 'grades' ? 'qc.grades' : 'qc.defectTypes'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            AppFormField(
              label: context.t('qc.lookupCode'),
              controller: _code,
              enabled: !editing,
              validator: (v) {
                final value = v?.trim() ?? '';
                if (value.isEmpty) return context.t('common.required');
                if (!RegExp(r'^[A-Z][A-Z0-9_]*$').hasMatch(value)) {
                  return context.t('qc.codeFormat');
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('qc.lookupLabel'),
              controller: _label,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? context.t('common.required')
                  : null,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('qc.sortOrder'),
              controller: _sortOrder,
              keyboardType: TextInputType.number,
            ),
            if (editing) ...[
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.t('qc.active')),
                value: _active,
                onChanged: (v) => setState(() => _active = v),
              ),
            ],
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
