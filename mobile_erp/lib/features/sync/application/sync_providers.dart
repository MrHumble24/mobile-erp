import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/local/database.dart';
import '../../../data/local/database_provider.dart';
import '../../../data/sync/conflict_store.dart';

/// Live view of the offline outbox — rows still in the queue (pending to send,
/// or marked `conflict`/`rejected`). Applied/duplicate rows are deleted, so
/// they never appear here.
final outboxQueueProvider = StreamProvider<List<OutboxData>>(
  (ref) => ref.watch(appDatabaseProvider).outboxDao.watchAll(),
);

/// Server-side sync conflicts awaiting a `sync.resolve` decision
/// (`GET /sync/conflicts`). Auto-disposed and refetched when invalidated.
final conflictsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(conflictStoreProvider).list(),
);
