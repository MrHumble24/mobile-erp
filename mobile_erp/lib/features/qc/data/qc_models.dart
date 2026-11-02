/// A QC lookup row (grade or defect type). Mirrors server `LookupView`.
class Lookup {
  const Lookup({
    required this.code,
    required this.label,
    required this.sortOrder,
    required this.isActive,
  });

  final String code;
  final String label;
  final int sortOrder;
  final bool isActive;

  factory Lookup.fromJson(Map<String, dynamic> json) => Lookup(
        code: json['code'] as String,
        label: json['label'] as String,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
        isActive: (json['isActive'] as bool?) ?? true,
      );
}

/// A counted bucket in the stats breakdowns (by grade / top defects).
class QcCount {
  const QcCount({required this.key, required this.label, required this.count});

  final String key;
  final String label;
  final int count;
}

/// QC statistics for a date range. Mirrors server `QcStatsView`.
/// `repairCostEstimate`-type cost fields are not part of stats.
class QcStats {
  const QcStats({
    required this.inspected,
    required this.passed,
    required this.failed,
    required this.passRate,
    required this.awaitingInspection,
    required this.byGrade,
    required this.topDefects,
    this.avgBatteryHealth,
  });

  final int inspected;
  final int passed;
  final int failed;

  /// Fraction 0..1 (multiply by 100 for a percentage).
  final double passRate;
  final int awaitingInspection;
  final int? avgBatteryHealth;
  final List<QcCount> byGrade;
  final List<QcCount> topDefects;

  factory QcStats.fromJson(Map<String, dynamic> json) => QcStats(
        inspected: (json['inspected'] as num?)?.toInt() ?? 0,
        passed: (json['passed'] as num?)?.toInt() ?? 0,
        failed: (json['failed'] as num?)?.toInt() ?? 0,
        passRate: (json['passRate'] as num?)?.toDouble() ?? 0,
        awaitingInspection:
            (json['awaitingInspection'] as num?)?.toInt() ?? 0,
        avgBatteryHealth: (json['avgBatteryHealth'] as num?)?.toInt(),
        byGrade: [
          for (final e in (json['byGrade'] as List? ?? const []))
            QcCount(
              key: (e as Map)['gradeCode'] as String,
              label: e['gradeCode'] as String,
              count: (e['count'] as num).toInt(),
            ),
        ],
        topDefects: [
          for (final e in (json['topDefects'] as List? ?? const []))
            QcCount(
              key: (e as Map)['defectCode'] as String,
              label: (e['label'] ?? e['defectCode']) as String,
              count: (e['count'] as num).toInt(),
            ),
        ],
      );
}

/// A device looked up by IMEI for grading. Subset of `DeviceDetailView`.
class QcDeviceDetail {
  const QcDeviceDetail({
    required this.id,
    required this.imei,
    required this.statusCode,
    required this.modelLabel,
    this.previousPassed,
  });

  final String id;
  final String imei;
  final String statusCode;
  final String modelLabel;
  final bool? previousPassed;

  factory QcDeviceDetail.fromJson(Map<String, dynamic> json) {
    final model = (json['model'] as Map?)?.cast<String, dynamic>();
    final prev = (json['latestInspection'] as Map?)?.cast<String, dynamic>();
    return QcDeviceDetail(
      id: json['id'] as String,
      imei: json['imei'] as String,
      statusCode: json['statusCode'] as String,
      modelLabel: model == null
          ? (json['modelId'] as String)
          : '${model['brand']} ${model['name']}',
      previousPassed: prev?['passed'] as bool?,
    );
  }
}

/// One inspection row with device + inspector context. Subset of the server
/// `QcInspectionListItem`. `repairCostEstimate` is redaction-nullable.
class QcInspection {
  const QcInspection({
    required this.id,
    required this.passed,
    required this.inspectedAt,
    required this.imei,
    required this.modelLabel,
    required this.inspectorName,
    required this.defectCodes,
    this.gradeCode,
    this.batteryHealth,
    this.repairCostEstimate,
  });

  final String id;
  final bool passed;
  final DateTime inspectedAt;
  final String imei;
  final String modelLabel;
  final String inspectorName;
  final List<String> defectCodes;
  final String? gradeCode;
  final int? batteryHealth;
  final String? repairCostEstimate;

  factory QcInspection.fromJson(Map<String, dynamic> json) {
    final device = (json['device'] as Map?)?.cast<String, dynamic>() ?? const {};
    final model = (device['model'] as Map?)?.cast<String, dynamic>();
    final inspector =
        (json['inspectedBy'] as Map?)?.cast<String, dynamic>() ?? const {};
    return QcInspection(
      id: json['id'] as String,
      passed: (json['passed'] as bool?) ?? false,
      inspectedAt: DateTime.parse(json['inspectedAt'] as String),
      imei: (device['imei'] ?? '') as String,
      modelLabel: model == null ? '' : '${model['brand']} ${model['name']}',
      inspectorName: (inspector['name'] ?? '') as String,
      gradeCode: json['gradeCode'] as String?,
      batteryHealth: (json['batteryHealth'] as num?)?.toInt(),
      repairCostEstimate: json['repairCostEstimate']?.toString(),
      defectCodes: [
        for (final d in (json['defects'] as List? ?? const []))
          (d as Map)['defectCode'] as String,
      ],
    );
  }
}

/// One page of inspections.
class PaginatedInspections {
  const PaginatedInspections({required this.items, required this.total});

  final List<QcInspection> items;
  final int total;

  factory PaginatedInspections.fromJson(Map<String, dynamic> json) =>
      PaginatedInspections(
        items: [
          for (final e in (json['items'] as List? ?? const []))
            QcInspection.fromJson((e as Map).cast()),
        ],
        total: (json['total'] as num?)?.toInt() ?? 0,
      );
}
