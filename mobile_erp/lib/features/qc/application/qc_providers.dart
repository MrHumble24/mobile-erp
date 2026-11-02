import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/qc_models.dart';
import '../data/qc_repository.dart';

/// Active grades for the grade picker.
final gradesProvider = FutureProvider<List<Lookup>>(
  (ref) => ref.watch(qcRepositoryProvider).listLookups('grades', false),
);

/// Active defect types for the defects checklist.
final defectTypesProvider = FutureProvider<List<Lookup>>(
  (ref) => ref.watch(qcRepositoryProvider).listLookups('defect-types', false),
);

/// Device looked up by IMEI for grading (scan or queue tap).
final deviceDetailProvider = FutureProvider.family<QcDeviceDetail, String>(
  (ref, imei) => ref.watch(qcRepositoryProvider).deviceByImei(imei),
);

/// Lookups for the manage tab: `(kind, includeInactive)`. `kind` is
/// `grades` or `defect-types`.
typedef LookupArg = ({String kind, bool includeInactive});

final lookupsProvider = FutureProvider.family<List<Lookup>, LookupArg>(
  (ref, arg) =>
      ref.watch(qcRepositoryProvider).listLookups(arg.kind, arg.includeInactive),
);

/// QC stats for a date range (ISO strings, both optional).
typedef StatsRange = ({String? from, String? to});

final qcStatsProvider = FutureProvider.family<QcStats, StatsRange>(
  (ref, range) =>
      ref.watch(qcRepositoryProvider).stats(from: range.from, to: range.to),
);

/// Inspections list page, filtered by pass/fail.
typedef InspectionsArg = ({String? passed, int page});

final qcInspectionsProvider =
    FutureProvider.family<PaginatedInspections, InspectionsArg>(
  (ref, arg) => ref.watch(qcRepositoryProvider).listInspections({
    if (arg.passed != null) 'passed': arg.passed,
    'page': arg.page,
    'pageSize': 50,
  }),
);
