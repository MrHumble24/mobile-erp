import 'package:decimal/decimal.dart';
import 'package:intl/intl.dart';

/// Money helpers. The server serializes `Decimal` as strings; parse defensively
/// (never with `double`) and format for display in USD. One source for both.

/// Parse a Decimal-string money value; null/garbage → zero.
Decimal parseMoney(String? value) =>
    value == null ? Decimal.zero : (Decimal.tryParse(value) ?? Decimal.zero);

final NumberFormat _currencyFormat = NumberFormat.currency(
  locale: 'en_US',
  symbol: '\$',
  decimalDigits: 0,
);

final NumberFormat _currencyFormatWithCents = NumberFormat.currency(
  locale: 'en_US',
  symbol: '\$',
  decimalDigits: 2,
);

/// Group-formatted USD amount with dollar symbol, e.g. `$1,250` or `$1,250.50`.
String formatMoney(String? value, {String? suffix}) {
  final amount = parseMoney(value);
  final d = amount.toDouble();
  final hasCents = (d - d.truncate()).abs() >= 0.005;
  final formatted = (hasCents ? _currencyFormatWithCents : _currencyFormat).format(d);
  if (suffix != null && suffix.isNotEmpty) {
    return '$formatted $suffix';
  }
  return formatted;
}
