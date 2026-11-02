import 'package:decimal/decimal.dart';
import 'package:intl/intl.dart';

/// Money helpers. The server serializes `Decimal` as strings; parse defensively
/// (never with `double`) and format for display in UZS. One source for both.

/// Parse a Decimal-string money value; null/garbage → zero.
Decimal parseMoney(String? value) =>
    value == null ? Decimal.zero : (Decimal.tryParse(value) ?? Decimal.zero);

final NumberFormat _grouping = NumberFormat.decimalPattern('uz');

/// Group-formatted amount with the som suffix, e.g. `1 250 000 so'm`.
/// UZS has no minor unit, so display rounds to whole som.
String formatMoney(String? value, {String suffix = "so'm"}) {
  final amount = parseMoney(value);
  // ponytail: display-only toDouble; arithmetic must stay on Decimal.
  return "${_grouping.format(amount.round().toBigInt().toInt())} $suffix";
}
