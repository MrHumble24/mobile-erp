import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../application/qc_providers.dart';
import '../data/qc_models.dart';

/// Past inspections, newest first.
class QcInspectionsTab extends ConsumerWidget {
  const QcInspectionsTab({super.key});

  static const _arg = (passed: null, page: 1);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(qcInspectionsProvider(_arg));
    return async.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorView(
        message: '$e',
        onRetry: () => ref.invalidate(qcInspectionsProvider(_arg)),
        retryLabel: context.t('common.retry'),
      ),
      data: (page) => page.items.isEmpty
          ? EmptyView(message: context.t('qc.queueEmpty'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: page.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _InspectionCard(item: page.items[i]),
            ),
    );
  }
}

class _InspectionCard extends StatelessWidget {
  const _InspectionCard({required this.item});
  final QcInspection item;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final subtitle = [
      item.modelLabel,
      if (item.gradeCode != null) '${context.t('qc.grade')}: ${item.gradeCode}',
      item.inspectorName,
    ].where((e) => e.isNotEmpty).join(' · ');
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.imei,
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
                const SizedBox(height: 4),
                Text(subtitle, style: text.bodySmall),
              ],
            ),
          ),
          StatusChip(
            context.t(item.passed ? 'qc.passed' : 'qc.failed'),
            color: item.passed ? AppColors.success : AppColors.danger,
          ),
        ],
      ),
    );
  }
}
