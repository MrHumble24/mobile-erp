import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/pos_repository.dart';

/// Reactive set of IMEIs with a pending offline `sale.create`. POS treats these
/// as already sold so a re-scan is rejected until the push drain reconciles.
/// Read-only over the outbox — the shared `devices` cache is never mutated.
final pendingSoldImeisProvider = StreamProvider<Set<String>>((ref) {
  return ref.watch(posRepositoryProvider).watchPendingSoldImeis();
});
