import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../application/qc_providers.dart';
import '../data/qc_models.dart';

/// QC statistics with quick date-range presets.
///
/// ponytail: the three quick presets cover daily use; the custom date-range
/// picker (`qc.preset_custom`) is skipped until someone needs an arbitrary span.
class QcStatsTab extends ConsumerStatefulWidget {
  const QcStatsTab({super.key});

  @override
  ConsumerState<QcStatsTab> createState() => _QcStatsTabState();
}

class _QcStatsTabState extends ConsumerState<QcStatsTab> {
  String _preset = '7d';

  StatsRange get _range {
    final now = DateTime.now();
    final from = switch (_preset) {
      'today' => DateTime(now.year, now.month, now.day),
      '30d' => now.subtract(const Duration(days: 30)),
      _ => now.subtract(const Duration(days: 7)),
    };
    return (from: from.toIso8601String(), to: now.toIso8601String());
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(qcStatsProvider(_range));
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Wrap(
          spacing: 8,
          children: [
            for (final p in ['today', '7d', '30d'])
              ChoiceChip(
                label: Text(context.t('qc.preset_$p')),
                selected: _preset == p,
                onSelected: (_) => setState(() => _preset = p),
              ),
          ],
        ),
        const SizedBox(height: 16),
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(message: '$e'),
          data: _StatsBody.new,
        ),
      ],
    );
  }
}

class _StatsBody extends StatelessWidget {
  const _StatsBody(this.stats);
  final QcStats stats;

  @override
  Widget build(BuildContext context) {
    final battery =
        stats.avgBatteryHealth == null ? '-' : '${stats.avgBatteryHealth}%';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _Tile(label: context.t('qc.statInspected'), value: '${stats.inspected}'),
            _Tile(
              label: context.t('qc.statPassRate'),
              value: '${(stats.passRate * 100).round()}%',
            ),
            _Tile(label: context.t('qc.statFailed'), value: '${stats.failed}'),
            _Tile(
              label: context.t('qc.awaitingInspection'),
              value: '${stats.awaitingInspection}',
            ),
            _Tile(label: context.t('qc.statAvgBattery'), value: battery),
          ],
        ),
        const SizedBox(height: 20),
        _Breakdown(title: context.t('qc.byGrade'), rows: stats.byGrade),
        const SizedBox(height: 16),
        _Breakdown(title: context.t('qc.topDefects'), rows: stats.topDefects),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return SizedBox(
      width: 150,
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: text.headlineSmall),
            const SizedBox(height: 4),
            Text(label, style: text.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _Breakdown extends StatelessWidget {
  const _Breakdown({required this.title, required this.rows});
  final String title;
  final List<QcCount> rows;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final max = rows.fold<int>(1, (m, r) => r.count > m ? r.count : m);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: text.titleMedium),
          const SizedBox(height: 10),
          if (rows.isEmpty)
            Text(context.t('common.notFound'), style: text.bodySmall)
          else
            for (final r in rows) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(r.label, style: text.bodyMedium),
                  Text('${r.count}', style: text.bodySmall),
                ],
              ),
              const SizedBox(height: 4),
              LinearProgressIndicator(
                value: r.count / max,
                backgroundColor: AppColors.bone,
              ),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}
