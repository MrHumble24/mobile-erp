/// Store-wide settings as returned by `GET /settings`. `minMarginPercent` is a
/// Decimal on the server, so it is kept as a string and parsed on submit.
class StoreSettings {
  const StoreSettings({
    required this.closingTime,
    required this.defaultWarrantyDays,
    required this.minMarginPercent,
    required this.lowStockThreshold,
    this.telegramChatId,
  });

  final String? telegramChatId;
  final String closingTime;
  final int defaultWarrantyDays;
  final String minMarginPercent;
  final int lowStockThreshold;

  factory StoreSettings.fromJson(Map<String, dynamic> json) => StoreSettings(
        telegramChatId: json['telegramChatId'] as String?,
        closingTime: (json['closingTime'] ?? '') as String,
        defaultWarrantyDays: (json['defaultWarrantyDays'] ?? 0) as int,
        minMarginPercent: '${json['minMarginPercent'] ?? 0}',
        lowStockThreshold: (json['lowStockThreshold'] ?? 0) as int,
      );
}
