/// One chronological ledger line for a partner: a consignment charge (positive
/// [change]) or a payment credit (negative [change]). Money stays a Decimal
/// string — mirror the server `LedgerEntry` shape, parse with `parseMoney`.
class LedgerEntry {
  const LedgerEntry({
    required this.at,
    required this.kind,
    required this.refId,
    required this.change,
    required this.runningBalance,
    this.statusCode,
    this.notes,
  });

  final DateTime at;

  /// `consignment` (adds to debt) or `payment` (reduces it).
  final String kind;
  final String refId;
  final String change;
  final String runningBalance;
  final String? statusCode;
  final String? notes;

  bool get isPayment => kind == 'payment';

  factory LedgerEntry.fromJson(Map<String, dynamic> json) => LedgerEntry(
        at: DateTime.parse(json['at'] as String),
        kind: json['kind'] as String,
        refId: json['refId'] as String,
        change: json['change'].toString(),
        runningBalance: json['runningBalance'].toString(),
        statusCode: json['statusCode'] as String?,
        notes: json['notes'] as String?,
      );
}
