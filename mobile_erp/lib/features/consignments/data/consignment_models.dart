/// Mirrors the server `ConsignmentView`. Money stays a Decimal string (parse
/// with `parseMoney`); dates are parsed to `DateTime`.
class ConsignmentView {
  const ConsignmentView({
    required this.id,
    required this.partnerId,
    required this.deviceId,
    required this.imei,
    required this.agreedPrice,
    required this.dueDate,
    required this.statusCode,
    required this.consignedAt,
    this.resolvedAt,
    this.notes,
  });

  final String id;
  final String partnerId;
  final String deviceId;
  final String imei;
  final String agreedPrice;
  final DateTime dueDate;
  final String statusCode;
  final DateTime consignedAt;
  final DateTime? resolvedAt;
  final String? notes;

  bool get isOut => statusCode == 'OUT';

  factory ConsignmentView.fromJson(Map<String, dynamic> json) =>
      ConsignmentView(
        id: json['id'] as String,
        partnerId: json['partnerId'] as String,
        deviceId: json['deviceId'] as String,
        imei: json['imei'] as String,
        agreedPrice: json['agreedPrice'].toString(),
        dueDate: DateTime.parse(json['dueDate'] as String),
        statusCode: json['statusCode'] as String,
        consignedAt: DateTime.parse(json['consignedAt'] as String),
        resolvedAt: json['resolvedAt'] == null
            ? null
            : DateTime.parse(json['resolvedAt'] as String),
        notes: json['notes'] as String?,
      );
}

/// A page of consignments (`GET /consignments`).
class ConsignmentPage {
  const ConsignmentPage({required this.items, required this.total});

  final List<ConsignmentView> items;
  final int total;

  factory ConsignmentPage.fromJson(Map<String, dynamic> json) => ConsignmentPage(
        items: (json['items'] as List? ?? const [])
            .map((e) => ConsignmentView.fromJson((e as Map).cast()))
            .toList(),
        total: (json['total'] as num?)?.toInt() ?? 0,
      );
}
