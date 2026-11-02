import 'package:flutter/material.dart';

import '../data/device_model.dart';

/// Renders one input per model attribute (sorted by order), bound to a `specs`
/// map the parent owns. `select` → dropdown, `number` → numeric field, else
/// text. Used by the edit-device dialog; the schema comes from the device model.
class DynamicSpecFields extends StatelessWidget {
  const DynamicSpecFields({
    required this.attributes,
    required this.values,
    required this.onChanged,
    super.key,
  });

  final List<AttributeDef> attributes;
  final Map<String, String> values;
  final void Function(String key, String value) onChanged;

  @override
  Widget build(BuildContext context) {
    final sorted = [...attributes]
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final attr in sorted) ...[
          _SpecField(
            attr: attr,
            value: values[attr.key] ?? '',
            onChanged: (v) => onChanged(attr.key, v),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _SpecField extends StatelessWidget {
  const _SpecField({
    required this.attr,
    required this.value,
    required this.onChanged,
  });

  final AttributeDef attr;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final label = attr.required ? '${attr.label} *' : attr.label;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        if (attr.type == AttributeType.select)
          DropdownButtonFormField<String>(
            initialValue: value.isEmpty ? null : value,
            isExpanded: true,
            items: [
              for (final o in attr.options)
                DropdownMenuItem(value: o, child: Text(o)),
            ],
            onChanged: (v) => onChanged(v ?? ''),
          )
        else
          TextFormField(
            initialValue: value,
            keyboardType: attr.type == AttributeType.number
                ? const TextInputType.numberWithOptions(decimal: true)
                : TextInputType.text,
            onChanged: onChanged,
          ),
      ],
    );
  }
}
