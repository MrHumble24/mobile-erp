import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/local/database.dart';
import '../../../data/sync/conflict_store.dart';
import '../../../data/sync/connectivity.dart';
import '../../../data/sync/sync_controller.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../../auth/application/permissions.dart';
import '../application/sync_providers.dart';

/// Sync status: a manual trigger, the live offline outbox, and — for a
/// `sync.resolve` user — the server conflict inbox.
class SyncScreen extends ConsumerWidget {
  const SyncScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(connectivityProvider).valueOrNull ?? true;
    final queue = ref.watch(outboxQueueProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Icon(online ? Icons.cloud_done_outlined : Icons.cloud_off,
                color: online ? AppColors.success : AppColors.ash),
            const SizedBox(width: 8),
            Text(context.t(online ? 'common.online' : 'common.offline'),
                style: Theme.of(context).textTheme.titleMedium),
            const Spacer(),
            FilledButton.icon(
              icon: const Icon(Icons.sync, size: 18),
              label: Text(context.t('common.syncNow')),
              onPressed: online
                  ? () {
                      ref.read(syncControllerProvider).syncNow();
                      ref.invalidate(conflictsProvider);
                    }
                  : null,
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(context.t('common.syncQueue'),
            style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        queue.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorView(message: '$e'),
          data: (rows) => rows.isEmpty
              ? EmptyView(message: context.t('common.noQueue'))
              : Column(children: [for (final r in rows) _QueueRow(r)]),
        ),
        if (ref.watch(canProvider)('sync.resolve')) ...[
          const SizedBox(height: 24),
          Text(context.t('common.conflicts'),
              style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          const _ConflictList(),
        ],
      ],
    );
  }
}

class _QueueRow extends StatelessWidget {
  const _QueueRow(this.row);
  final OutboxData row;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (row.status) {
      'conflict' => (AppColors.warning, context.t('common.statusConflict')),
      'rejected' => (AppColors.danger, context.t('common.statusRejected')),
      _ => (AppColors.ash, context.t('common.statusPending')),
    };
    return AppCard(
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(row.type),
        subtitle: row.lastError == null ? null : Text(row.lastError!),
        trailing: StatusChip(label, color: color),
      ),
    );
  }
}

class _ConflictList extends ConsumerWidget {
  const _ConflictList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(conflictsProvider).when(
          loading: () => const Loading(),
          error: (e, _) => ErrorView(message: '$e'),
          data: (rows) => rows.isEmpty
              ? EmptyView(
                  message: context.t('common.noConflicts'),
                  icon: Icons.check_circle_outline)
              : Column(children: [for (final r in rows) _ConflictRow(row: r)]),
        );
  }
}

class _ConflictRow extends ConsumerWidget {
  const _ConflictRow({required this.row});
  final Map<String, dynamic> row;

  Future<void> _resolve(WidgetRef ref, String resolution) async {
    final id = row['id']?.toString();
    if (id == null) return;
    await ref.read(conflictStoreProvider).resolve(id, resolution);
    ref.invalidate(conflictsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = row['type']?.toString() ?? row['entity']?.toString() ?? '—';
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          if (row['id'] != null)
            Text('${row['id']}', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _resolve(ref, 'keep-server'),
                  child: Text(context.t('common.keepServer')),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: () => _resolve(ref, 'apply-terminal'),
                  child: Text(context.t('common.applyTerminal')),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
