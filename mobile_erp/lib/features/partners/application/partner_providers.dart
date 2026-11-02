import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../data/local/database.dart';
import '../../../data/local/database_provider.dart';
import '../../../data/sync/connectivity.dart';
import '../../../data/sync/sync_controller.dart';
import '../data/partner_ledger.dart';
import '../data/partner_repository.dart';

/// Offline-first partner directory: the Drift `partners` table, hydrated by the
/// foundation's `/sync/changes` pull. Emits on every cache change.
final partnersStreamProvider = StreamProvider<List<Partner>>(
  (ref) => ref.watch(appDatabaseProvider).partnerDao.watchAll(),
);

/// A partner's ledger — online only (not part of the changes feed).
final partnerLedgerProvider =
    FutureProvider.family<List<LedgerEntry>, String>((ref, partnerId) {
  return ref.watch(partnerRepositoryProvider).ledger(partnerId);
});

/// Create-partner and record-payment are online-only writes (no server offline
/// handler). Both block when offline and, on success, trigger a sync so the
/// Drift balances refresh.
class PartnerActions {
  PartnerActions(this._ref);
  final Ref _ref;

  bool get _online =>
      _ref.read(connectivityProvider).valueOrNull ?? true;

  Future<void> create(Map<String, dynamic> body) async {
    if (!_online) throw const AppException(0, 'offline');
    await _ref.read(partnerRepositoryProvider).create(body);
    _ref.read(syncControllerProvider).syncNow();
  }

  Future<void> recordPayment(String partnerId, Map<String, dynamic> body) async {
    if (!_online) throw const AppException(0, 'offline');
    await _ref.read(partnerRepositoryProvider).recordPayment(partnerId, body);
    _ref.read(syncControllerProvider).syncNow();
  }
}

final partnerActionsProvider =
    Provider<PartnerActions>((ref) => PartnerActions(ref));
