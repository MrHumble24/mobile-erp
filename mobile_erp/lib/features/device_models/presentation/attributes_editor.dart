import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import '../data/device_model.dart';
import 'options_chips_editor.dart';

/// Controlled editor for a model's spec schema: add / remove / reorder
/// [AttributeDef] rows. The parent owns the list; this emits the next list.
class AttributesEditor extends StatelessWidget {
  const AttributesEditor({
    required this.attributes,
    required this.savedKeys,
    required this.onChanged,
    super.key,
  });

  final List<AttributeDef> attributes;

  /// Keys already persisted — their `key` is locked (renaming orphans specs).
  final Set<String> savedKeys;
  final ValueChanged<List<AttributeDef>> onChanged;

  void _update(int index, AttributeDef next) {
    final list = [...attributes]..[index] = next;
    onChanged(list);
  }

  void _add() {
    onChanged([
      ...attributes,
      AttributeDef(
        key: '',
        label: '',
        type: AttributeType.text,
        sortOrder: attributes.length,
      ),
    ]);
  }

  void _remove(int index) {
    final list = [...attributes]..removeAt(index);
    onChanged(_reindexed(list));
  }

  void _move(int index, int delta) {
    final target = index + delta;
    if (target < 0 || target >= attributes.length) return;
    final list = [...attributes];
    final item = list.removeAt(index);
    list.insert(target, item);
    onChanged(_reindexed(list));
  }

  List<AttributeDef> _reindexed(List<AttributeDef> list) => [
        for (var i = 0; i < list.length; i++) list[i].copyWith(sortOrder: i),
      ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              context.t('inventory.attrSectionTitle'),
              style: Theme.of(context).textTheme.labelLarge,
            ),
            OutlinedButton.icon(
              onPressed: _add,
              icon: const Icon(Icons.add, size: 18),
              label: Text(context.t('inventory.attrAdd')),
            ),
          ],
        ),
        const SizedBox(height: 8),
        for (var i = 0; i < attributes.length; i++) ...[
          _AttributeRow(
            key: ValueKey('attr-$i'),
            attr: attributes[i],
            keyLocked: savedKeys.contains(attributes[i].key),
            isFirst: i == 0,
            isLast: i == attributes.length - 1,
            onChanged: (next) => _update(i, next),
            onMoveUp: () => _move(i, -1),
            onMoveDown: () => _move(i, 1),
            onRemove: () => _remove(i),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _AttributeRow extends StatelessWidget {
  const _AttributeRow({
    required this.attr,
    required this.keyLocked,
    required this.isFirst,
    required this.isLast,
    required this.onChanged,
    required this.onMoveUp,
    required this.onMoveDown,
    required this.onRemove,
    super.key,
  });

  final AttributeDef attr;
  final bool keyLocked;
  final bool isFirst;
  final bool isLast;
  final ValueChanged<AttributeDef> onChanged;
  final VoidCallback onMoveUp;
  final VoidCallback onMoveDown;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: attr.label,
                    decoration: InputDecoration(
                      labelText: context.t('inventory.attrLabel'),
                    ),
                    onChanged: (v) => onChanged(attr.copyWith(label: v)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue: attr.key,
                    enabled: !keyLocked,
                    decoration: InputDecoration(
                      labelText: context.t('inventory.attrKey'),
                    ),
                    onChanged: (v) => onChanged(attr.copyWith(key: v)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<AttributeType>(
                    initialValue: attr.type,
                    decoration: InputDecoration(
                      labelText: context.t('inventory.attrType'),
                    ),
                    items: [
                      DropdownMenuItem(
                        value: AttributeType.text,
                        child: Text(context.t('inventory.attrTypeText')),
                      ),
                      DropdownMenuItem(
                        value: AttributeType.number,
                        child: Text(context.t('inventory.attrTypeNumber')),
                      ),
                      DropdownMenuItem(
                        value: AttributeType.select,
                        child: Text(context.t('inventory.attrTypeSelect')),
                      ),
                    ],
                    onChanged: (v) =>
                        onChanged(attr.copyWith(type: v ?? AttributeType.text)),
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  children: [
                    Text(
                      context.t('inventory.attrRequired'),
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    Switch(
                      value: attr.required,
                      onChanged: (v) => onChanged(attr.copyWith(required: v)),
                    ),
                  ],
                ),
              ],
            ),
            if (attr.type == AttributeType.select) ...[
              const SizedBox(height: 8),
              OptionsChipsEditor(
                options: attr.options,
                onChanged: (opts) => onChanged(attr.copyWith(options: opts)),
              ),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  onPressed: isFirst ? null : onMoveUp,
                  icon: const Icon(Icons.arrow_upward, size: 18),
                ),
                IconButton(
                  onPressed: isLast ? null : onMoveDown,
                  icon: const Icon(Icons.arrow_downward, size: 18),
                ),
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline, size: 18),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
