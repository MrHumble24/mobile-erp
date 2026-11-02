import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/local/database.dart';
import '../../../data/local/database_provider.dart';
import '../data/consignment_models.dart';
import '../data/consignment_repository.dart';

/// Consignments for a status tab (null = All). Online read — consignments are
/// not in the `/sync/changes` feed.
final consignmentsProvider =
    FutureProvider.family<List<ConsignmentView>, String?>((ref, statusCode) async {
  final page = await ref.watch(consignmentRepositoryProvider).list(statusCode: statusCode);
  return page.items;
});

/// Overdue consignments (`GET /consignments/overdue`).
final overdueConsignmentsProvider =
    FutureProvider<List<ConsignmentView>>((ref) {
  return ref.watch(consignmentRepositoryProvider).overdue();
});

/// Partner options for the consign-device picker, read offline-first straight
/// from the shared Drift `partners` cache (no cross-feature import).
final consignPartnersProvider = StreamProvider<List<Partner>>(
  (ref) => ref.watch(appDatabaseProvider).partnerDao.watchAll(),
);

/// Invalidate every consignment read after a write so the tabs refetch.
void refreshConsignments(WidgetRef ref) {
  ref.invalidate(consignmentsProvider);
  ref.invalidate(overdueConsignmentsProvider);
}
