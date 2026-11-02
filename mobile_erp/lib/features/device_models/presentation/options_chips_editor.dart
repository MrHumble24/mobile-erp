import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';

/// Chip editor for a `select` attribute's options: type + Enter to add, tap the
/// X to remove. The parent owns the list.
class OptionsChipsEditor extends StatefulWidget {
  const OptionsChipsEditor({
    required this.options,
    required this.onChanged,
    super.key,
  });

  final List<String> options;
  final ValueChanged<List<String>> onChanged;

  @override
  State<OptionsChipsEditor> createState() => _OptionsChipsEditorState();
}

class _OptionsChipsEditorState extends State<OptionsChipsEditor> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _add(String raw) {
    final value = raw.trim();
    _controller.clear();
    if (value.isEmpty || widget.options.contains(value)) return;
    widget.onChanged([...widget.options, value]);
  }

  void _remove(String option) {
    widget.onChanged(widget.options.where((o) => o != option).toList());
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.t('inventory.attrOptions'),
          style: Theme.of(context).textTheme.labelSmall,
        ),
        const SizedBox(height: 4),
        if (widget.options.isNotEmpty)
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final o in widget.options)
                Chip(
                  label: Text(o),
                  onDeleted: () => _remove(o),
                ),
            ],
          ),
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: context.t('inventory.attrOptionsPlaceholder'),
          ),
          onSubmitted: _add,
        ),
      ],
    );
  }
}
