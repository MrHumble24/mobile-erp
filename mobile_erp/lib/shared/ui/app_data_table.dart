import 'package:flutter/material.dart';

/// A thin, themed wrapper over [DataTable] for tabular screens (sales, reports).
/// Horizontally scrollable so it survives narrow widths. For simple vertical
/// lists prefer `ListView` + `AppCard`; use this when columns matter.
class AppDataTable<T> extends StatelessWidget {
  const AppDataTable({
    required this.columns,
    required this.rows,
    required this.cells,
    this.onRowTap,
    super.key,
  });

  final List<String> columns;
  final List<T> rows;

  /// Builds the cells (one per column) for a row.
  final List<Widget> Function(T row) cells;
  final void Function(T row)? onRowTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingTextStyle: text.labelLarge,
        dataTextStyle: text.bodyMedium,
        columns: [for (final c in columns) DataColumn(label: Text(c))],
        rows: [
          for (final row in rows)
            DataRow(
              onSelectChanged: onRowTap == null ? null : (_) => onRowTap!(row),
              cells: [for (final cell in cells(row)) DataCell(cell)],
            ),
        ],
      ),
    );
  }
}
