import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../application/sales_providers.dart';
import '../data/sale_models.dart';
import '../data/sales_repository.dart';

/// Channel + date-range filters for the sales list. Writes to [salesFilterProvider].
class SalesFiltersBar extends ConsumerWidget {
  const SalesFiltersBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filters = ref.watch(salesFilterProvider);
    final ctrl = ref.read(salesFilterProvider.notifier);
    return Wrap(
      spacing: 12,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        SegmentedButton<SaleChannel?>(
          selected: {filters.channel},
          emptySelectionAllowed: true,
          onSelectionChanged: (s) => ctrl.setChannel(s.isEmpty ? null : s.first),
          segments: [
            ButtonSegment(value: null, label: Text(context.t('common.all'))),
            ButtonSegment(
                value: SaleChannel.retail,
                label: Text(context.t('sales.channelRetail'))),
            ButtonSegment(
                value: SaleChannel.b2b,
                label: Text(context.t('sales.channelB2B'))),
          ],
        ),
        OutlinedButton.icon(
          icon: const Icon(Icons.date_range),
          label: Text(_rangeLabel(context, filters)),
          onPressed: () async {
            final now = DateTime.now();
            final picked = await showDateRangePicker(
              context: context,
              firstDate: DateTime(now.year - 3),
              lastDate: DateTime(now.year + 1),
            );
            if (picked != null) ctrl.setRange(picked.start, picked.end);
          },
        ),
        if (filters.from != null || filters.channel != null)
          TextButton(
            onPressed: ctrl.clear,
            child: Text(context.t('common.cancel')),
          ),
      ],
    );
  }

  String _rangeLabel(BuildContext context, SaleFilters f) {
    if (f.from == null || f.to == null) return context.t('common.date');
    String d(DateTime x) =>
        '${x.month.toString().padLeft(2, '0')}/${x.day.toString().padLeft(2, '0')}';
    return '${d(f.from!)} – ${d(f.to!)}';
  }
}
