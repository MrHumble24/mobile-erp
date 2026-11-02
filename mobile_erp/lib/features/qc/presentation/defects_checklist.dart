import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import '../data/qc_models.dart';

/// Checklist of defect types: tick the ones present, add an optional note per
/// ticked defect. Parent owns the selection + notes state.
class DefectsChecklist extends StatelessWidget {
  const DefectsChecklist({
    required this.defectTypes,
    required this.selected,
    required this.notes,
    required this.onToggle,
    required this.onNote,
    this.hasError = false,
    super.key,
  });

  final List<Lookup> defectTypes;
  final Set<String> selected;
  final Map<String, String> notes;
  final void Function(String code, bool value) onToggle;
  final void Function(String code, String note) onNote;
  final bool hasError;

  @override
  Widget build(BuildContext context) {
    if (defectTypes.isEmpty) return const SizedBox.shrink();
    final color = hasError ? Theme.of(context).colorScheme.error : null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.t('qc.defects'),
          style: Theme.of(context).textTheme.labelLarge?.copyWith(color: color),
        ),
        const SizedBox(height: 6),
        for (final d in defectTypes)
          _DefectRow(
            defect: d,
            checked: selected.contains(d.code),
            note: notes[d.code] ?? '',
            onToggle: (v) => onToggle(d.code, v),
            onNote: (v) => onNote(d.code, v),
          ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(context.t('qc.failNeedsDefect'),
              style: TextStyle(color: color, fontSize: 12)),
        ],
      ],
    );
  }
}

class _DefectRow extends StatelessWidget {
  const _DefectRow({
    required this.defect,
    required this.checked,
    required this.note,
    required this.onToggle,
    required this.onNote,
  });

  final Lookup defect;
  final bool checked;
  final String note;
  final ValueChanged<bool> onToggle;
  final ValueChanged<String> onNote;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          dense: true,
          controlAffinity: ListTileControlAffinity.leading,
          value: checked,
          onChanged: (v) => onToggle(v ?? false),
          title: Text(defect.label),
        ),
        if (checked)
          Padding(
            padding: const EdgeInsets.only(left: 40, bottom: 8),
            child: TextFormField(
              initialValue: note,
              onChanged: onNote,
              decoration: InputDecoration(hintText: context.t('qc.defectNotes')),
            ),
          ),
      ],
    );
  }
}
