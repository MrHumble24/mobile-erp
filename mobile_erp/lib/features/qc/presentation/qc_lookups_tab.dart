import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../../auth/application/permissions.dart';
import '../application/qc_providers.dart';
import '../data/qc_models.dart';
import 'lookup_form_sheet.dart';

/// Manage QC grades and defect types. Writes need `settings.manage`.
class QcLookupsTab extends ConsumerStatefulWidget {
  const QcLookupsTab({super.key});

  @override
  ConsumerState<QcLookupsTab> createState() => _QcLookupsTabState();
}

class _QcLookupsTabState extends ConsumerState<QcLookupsTab> {
  bool _includeInactive = false;

  @override
  Widget build(BuildContext context) {
    final canManage = ref.watch(canProvider)('settings.manage');
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(context.t('qc.active')),
          value: !_includeInactive,
          onChanged: (v) => setState(() => _includeInactive = !v),
        ),
        _LookupSection(
          kind: 'grades',
          title: context.t('qc.grades'),
          includeInactive: _includeInactive,
          canManage: canManage,
        ),
        const SizedBox(height: 20),
        _LookupSection(
          kind: 'defect-types',
          title: context.t('qc.defectTypes'),
          includeInactive: _includeInactive,
          canManage: canManage,
        ),
      ],
    );
  }
}

class _LookupSection extends ConsumerWidget {
  const _LookupSection({
    required this.kind,
    required this.title,
    required this.includeInactive,
    required this.canManage,
  });

  final String kind;
  final String title;
  final bool includeInactive;
  final bool canManage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final arg = (kind: kind, includeInactive: includeInactive);
    final async = ref.watch(lookupsProvider(arg));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            if (canManage)
              TextButton.icon(
                onPressed: () => showLookupFormSheet(context, kind: kind),
                icon: const Icon(Icons.add),
                label: Text(context.t('common.add')),
              ),
          ],
        ),
        const SizedBox(height: 8),
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: Loading(),
          ),
          error: (e, _) => ErrorView(message: '$e'),
          data: (rows) => rows.isEmpty
              ? EmptyView(message: context.t('common.notFound'))
              : Column(
                  children: [
                    for (final row in rows)
                      _LookupRow(
                        kind: kind,
                        row: row,
                        canManage: canManage,
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _LookupRow extends StatelessWidget {
  const _LookupRow({
    required this.kind,
    required this.row,
    required this.canManage,
  });

  final String kind;
  final Lookup row;
  final bool canManage;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(row.label),
      subtitle: Text(row.code,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
      trailing: row.isActive
          ? (canManage ? const Icon(Icons.chevron_right) : null)
          : StatusChip(context.t('common.no'), color: AppColors.ash),
      onTap: canManage
          ? () => showLookupFormSheet(context, kind: kind, existing: row)
          : null,
    );
  }
}
