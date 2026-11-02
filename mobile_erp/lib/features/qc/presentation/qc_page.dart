import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import 'grade_device_sheet.dart';
import 'qc_inspections_tab.dart';
import 'qc_lookups_tab.dart';
import 'qc_queue_tab.dart';
import 'qc_stats_tab.dart';

/// `/qc` — a scan header over four tabs: queue, inspections, stats, lookups.
/// Scanning an IMEI opens the grade sheet for that unit. Gated `qc.read`.
class QcPage extends StatelessWidget {
  const QcPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: ScannerField(
              hintText: context.t('qc.scanPlaceholder'),
              onScan: (imei) => showGradeDeviceSheet(context, imei),
            ),
          ),
          TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: context.t('qc.tabQueue')),
              Tab(text: context.t('qc.tabInspections')),
              Tab(text: context.t('qc.tabStats')),
              Tab(text: context.t('qc.tabLookups')),
            ],
          ),
          const Expanded(
            child: TabBarView(
              children: [
                QcQueueTab(),
                QcInspectionsTab(),
                QcStatsTab(),
                QcLookupsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
