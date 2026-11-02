import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/sales_providers.dart';
import '../data/sales_views.dart';

/// 58mm thermal-style printable receipt for one sale. Fetches the server
/// [ReceiptView] (no cost/profit, ever) and renders it monospaced inside a
/// narrow paper column. Copy-to-clipboard works everywhere; the Print action is
/// stubbed until wave 8 wires ESC-POS / system printing.
class ReceiptViewPanel extends ConsumerWidget {
  const ReceiptViewPanel({required this.saleId, super.key});

  final String saleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(receiptProvider(saleId));
    return async.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorView(
        message: '$e',
        onRetry: () => ref.invalidate(receiptProvider(saleId)),
        retryLabel: context.t('common.retry'),
      ),
      data: (r) => _Paper(receipt: r),
    );
  }
}

String buildReceiptText(BuildContext context, ReceiptView r) {
  final lines = <String>[
    context.t('pos.storeName'),
    context.t('pos.storeLocation'),
    '${context.t('pos.receiptNumber')}: ${r.saleId}',
    if (r.soldAt != null) '${context.t('pos.soldAt')}: ${_fmt(r.soldAt!)}',
    '${context.t('pos.cashier')}: ${r.cashier}',
    '------------------------------',
    for (final it in r.items)
      '${it.model} (${it.imei})  ${formatMoney(it.price)}',
    '------------------------------',
    '${context.t('pos.totalDue')}: ${formatMoney(r.total)}',
    if (r.warrantyEndsAt != null)
      '${context.t('pos.warrantyUntil')}: ${_fmt(r.warrantyEndsAt!)}',
    context.t('pos.thankYou'),
  ];
  return lines.join('\n');
}

String _fmt(DateTime d) =>
    '${d.year}-${_pad(d.month)}-${_pad(d.day)} ${_pad(d.hour)}:${_pad(d.minute)}';
String _pad(int n) => n.toString().padLeft(2, '0');

class _Paper extends StatelessWidget {
  const _Paper({required this.receipt});
  final ReceiptView receipt;

  @override
  Widget build(BuildContext context) {
    const mono = TextStyle(fontFamily: 'monospace', fontSize: 12, height: 1.4);
    final r = receipt;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 280), // ~58mm
          child: AppCard(
            child: DefaultTextStyle(
              style: mono,
              textAlign: TextAlign.center,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(context.t('pos.storeName'),
                      style: mono.copyWith(fontWeight: FontWeight.bold)),
                  Text(context.t('pos.storeLocation')),
                  const _Rule(),
                  _row('${context.t('pos.receiptNumber')}:', r.saleId),
                  if (r.soldAt != null)
                    _row('${context.t('pos.soldAt')}:', _fmt(r.soldAt!)),
                  _row('${context.t('pos.cashier')}:', r.cashier),
                  if (r.customerName != null)
                    _row('${context.t('sales.customer')}:', r.customerName!),
                  const _Rule(),
                  for (final it in r.items) _ItemLine(item: it),
                  const _Rule(),
                  _row('${context.t('pos.totalDue')}:', formatMoney(r.total),
                      bold: true),
                  if (r.warrantyEndsAt != null)
                    _row('${context.t('pos.warrantyUntil')}:',
                        _fmt(r.warrantyEndsAt!)),
                  const SizedBox(height: 8),
                  Text(context.t('pos.thankYou')),
                  Text(context.t('pos.warrantyNotice'),
                      style: mono.copyWith(fontSize: 10)),
                  const SizedBox(height: 16),
                  _Actions(text: () => buildReceiptText(context, r)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(child: Text(label, textAlign: TextAlign.left)),
            const SizedBox(width: 8),
            Flexible(
              child: Text(value,
                  textAlign: TextAlign.right,
                  style: bold
                      ? const TextStyle(
                          fontFamily: 'monospace', fontWeight: FontWeight.bold)
                      : null),
            ),
          ],
        ),
      );
}

class _ItemLine extends StatelessWidget {
  const _ItemLine({required this.item});
  final ReceiptItem item;

  @override
  Widget build(BuildContext context) {
    final sub = [item.storage, item.color].where((e) => e != null).join(' · ');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(item.model),
        Text(item.imei, style: const TextStyle(fontSize: 10)),
        if (sub.isNotEmpty) Text(sub, style: const TextStyle(fontSize: 10)),
        Align(alignment: Alignment.centerRight, child: Text(formatMoney(item.price))),
        const SizedBox(height: 4),
      ],
    );
  }
}

class _Rule extends StatelessWidget {
  const _Rule();
  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 4),
        child: Text('------------------------------',
            style: TextStyle(fontFamily: 'monospace', fontSize: 12)),
      );
}

class _Actions extends StatelessWidget {
  const _Actions({required this.text});
  final String Function() text;

  @override
  Widget build(BuildContext context) {
    final messenger = ScaffoldMessenger.of(context);
    return Column(
      children: [
        OutlinedButton.icon(
          icon: const Icon(Icons.copy),
          label: Text(context.t('pos.copyCheque')),
          onPressed: () async {
            final copied = context.t('pos.chequeCopied');
            await Clipboard.setData(ClipboardData(text: text()));
            messenger.showSnackBar(SnackBar(content: Text(copied)));
          },
        ),
        const SizedBox(height: 8),
        FilledButton.icon(
          icon: const Icon(Icons.print),
          label: Text(context.t('sales.printReceipt')),
          // TODO(wave8): wire ESC-POS (mobile BT) / system print (desktop)
          // behind a ReceiptPrinter interface. No printing dependency yet.
          onPressed: () => messenger.showSnackBar(
            SnackBar(content: Text(context.t('sales.printReceipt'))),
          ),
        ),
      ],
    );
  }
}
