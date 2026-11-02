import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../auth/application/permissions.dart';
import '../../shipments/shipments_module.dart' show deviceQueryProvider;
import '../../suppliers/suppliers_module.dart' show ensureOnline;
import '../application/qc_providers.dart';
import '../data/qc_models.dart';
import '../data/qc_repository.dart';
import 'defects_checklist.dart';

/// Grade a device: fetch it by IMEI, then show the inspection form. Opened by a
/// queue tap or a scan on the QC page. Online-only write.
Future<void> showGradeDeviceSheet(BuildContext context, String imei) {
  return showAppBottomSheet<void>(
    context,
    builder: (_) => _GradeLoader(imei: imei),
  );
}

class _GradeLoader extends ConsumerWidget {
  const _GradeLoader({required this.imei});
  final String imei;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final device = ref.watch(deviceDetailProvider(imei));
    final grades = ref.watch(gradesProvider);
    final defects = ref.watch(defectTypesProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: switch ((device, grades, defects)) {
        (AsyncData(value: final d), AsyncData(value: final g), AsyncData(value: final f)) =>
          _GradeForm(device: d, grades: g, defectTypes: f),
        (AsyncError(:final error), _, _) => ErrorView(message: '$error'),
        _ => const Padding(padding: EdgeInsets.all(24), child: Loading()),
      },
    );
  }
}

class _GradeForm extends ConsumerStatefulWidget {
  const _GradeForm({
    required this.device,
    required this.grades,
    required this.defectTypes,
  });

  final QcDeviceDetail device;
  final List<Lookup> grades;
  final List<Lookup> defectTypes;

  @override
  ConsumerState<_GradeForm> createState() => _GradeFormState();
}

class _GradeFormState extends ConsumerState<_GradeForm> {
  bool _passed = true;
  String? _gradeCode;
  final _battery = TextEditingController(text: '100');
  final _repairCost = TextEditingController();
  final _notes = TextEditingController();
  final _selected = <String>{};
  final _defectNotes = <String, String>{};
  bool _busy = false;
  bool _defectError = false;
  String? _error;

  @override
  void dispose() {
    _battery.dispose();
    _repairCost.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_passed && _selected.isEmpty) {
      setState(() => _defectError = true);
      return;
    }
    if (!ensureOnline(ref, context)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final canCost = ref.read(canProvider)('device.cost.view');
    final repair = num.tryParse(_repairCost.text.trim());
    final body = <String, dynamic>{
      'deviceId': widget.device.id,
      'passed': _passed,
      if (_gradeCode != null) 'gradeCode': _gradeCode,
      if (int.tryParse(_battery.text.trim()) != null)
        'batteryHealth': int.parse(_battery.text.trim()),
      if (canCost && repair != null && repair > 0) 'repairCostEstimate': repair,
      if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
      'defects': [
        for (final code in _selected)
          {
            'defectCode': code,
            if ((_defectNotes[code] ?? '').trim().isNotEmpty)
              'notes': _defectNotes[code]!.trim(),
          },
      ],
    };
    try {
      await ref.read(qcRepositoryProvider).createInspection(body);
      ref.invalidate(deviceQueryProvider);
      ref.invalidate(qcInspectionsProvider);
      ref.invalidate(qcStatsProvider);
      ref.invalidate(deviceDetailProvider(widget.device.imei));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.t('qc.inspectionSaved'))),
        );
        Navigator.of(context).pop();
      }
    } on AppException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canCost = ref.watch(canProvider)('device.cost.view');
    final text = Theme.of(context).textTheme;
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.t('qc.runInspection'), style: text.titleLarge),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.device.imei,
                    style: const TextStyle(fontFamily: 'monospace')),
                Text(widget.device.modelLabel, style: text.bodySmall),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SegmentedButton<bool>(
            segments: [
              ButtonSegment(value: true, label: Text(context.t('qc.passed'))),
              ButtonSegment(value: false, label: Text(context.t('qc.failed'))),
            ],
            selected: {_passed},
            onSelectionChanged: (s) => setState(() => _passed = s.first),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _gradeCode,
            decoration: InputDecoration(labelText: context.t('qc.grade')),
            items: [
              for (final g in widget.grades)
                DropdownMenuItem(value: g.code, child: Text(g.label)),
            ],
            onChanged: (v) => setState(() => _gradeCode = v),
          ),
          const SizedBox(height: 12),
          AppFormField(
            label: context.t('qc.batteryHealth'),
            controller: _battery,
            keyboardType: TextInputType.number,
          ),
          if (canCost) ...[
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('qc.repairCostEstimate'),
              controller: _repairCost,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
            ),
          ],
          const SizedBox(height: 12),
          AppFormField(label: context.t('common.notes'), controller: _notes),
          const SizedBox(height: 16),
          DefectsChecklist(
            defectTypes: widget.defectTypes,
            selected: _selected,
            notes: _defectNotes,
            hasError: _defectError,
            onToggle: (code, v) => setState(() {
              if (v) {
                _selected.add(code);
              } else {
                _selected.remove(code);
              }
              _defectError = false;
            }),
            onNote: (code, note) => _defectNotes[code] = note,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(context.t(_busy ? 'common.loading' : 'common.save')),
          ),
        ],
      ),
    );
  }
}
