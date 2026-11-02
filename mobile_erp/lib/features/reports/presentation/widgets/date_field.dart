import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

final _fmt = DateFormat('dd.MM.yyyy');

/// A tappable date field (label + value) that opens the native date picker.
/// Shared by the report tabs that filter by date.
class DateField extends StatelessWidget {
  const DateField({
    required this.label,
    required this.value,
    required this.onChanged,
    super.key,
  });

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180,
      child: InputDecorator(
        decoration: InputDecoration(labelText: label),
        child: InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: value ?? DateTime.now(),
              firstDate: DateTime(2020),
              lastDate: DateTime.now(),
            );
            if (picked != null) onChanged(picked);
          },
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(value == null ? '—' : _fmt.format(value!)),
              const Icon(Icons.calendar_today, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
