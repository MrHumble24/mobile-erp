import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/printing/receipt_printer.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../application/pos_controller.dart';
import '../data/pos_models.dart';

/// Post-checkout receipt. Built from the local [CompletedSale] so it renders
/// identically online and offline; a queued sale shows a "pending sync" badge.
/// Copy-to-clipboard and Print (58mm system print via `printReceipt`) both work.
///
/// ponytail: this 58mm layout mirrors sales/receipt_view; kept local so POS
/// stays offline-capable (no server ReceiptView when queued) and independent of
/// the sales slice. A shared shared/ui receipt widget is the future home.
class PosReceiptModal extends ConsumerWidget {
  const PosReceiptModal({required this.sale, super.key});

  final CompletedSale sale;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const mono = TextStyle(fontFamily: 'monospace', fontSize: 12, height: 1.4);
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (sale.pending)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Center(
                child: StatusChip(context.t('common.offline'),
                    color: AppColors.warning),
              ),
            ),
          AppCard(
            child: DefaultTextStyle(
              style: mono,
              textAlign: TextAlign.center,
              child: Column(
                children: [
                  Text(context.t('pos.storeName'),
                      style: mono.copyWith(fontWeight: FontWeight.bold)),
                  Text(context.t('pos.storeLocation')),
                  const _Rule(),
                  _row('${context.t('pos.receiptNumber')}:', sale.receiptId),
                  _row('${context.t('pos.soldAt')}:', _fmt(sale.soldAt)),
                  _row('${context.t('pos.cashier')}:', sale.cashier),
                  if (sale.customerName != null)
                    _row('${context.t('sales.customer')}:', sale.customerName!),
                  const _Rule(),
                  Text(sale.modelLabel),
                  Text(sale.imei, style: const TextStyle(fontSize: 10)),
                  const _Rule(),
                  _row('${context.t('pos.totalDue')}:',
                      formatMoney(sale.salePrice),
                      bold: true),
                  if (sale.warrantyEndsAt != null)
                    _row('${context.t('pos.warrantyUntil')}:',
                        _fmt(sale.warrantyEndsAt!)),
                  const SizedBox(height: 8),
                  Text(context.t('pos.thankYou')),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            icon: const Icon(Icons.copy),
            label: Text(context.t('pos.copyCheque')),
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: _text(context)));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(context.t('pos.chequeCopied'))),
                );
              }
            },
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            icon: const Icon(Icons.print),
            label: Text(context.t('pos.printCheque')),
            onPressed: () => printReceipt(
              title: context.t('pos.storeName'),
              headerLines: [
                context.t('pos.storeLocation'),
                '${context.t('pos.receiptNumber')}: ${sale.receiptId}',
                '${context.t('pos.soldAt')}: ${_fmt(sale.soldAt)}',
              ],
              rows: [
                ReceiptRow('${context.t('pos.cashier')}:', sale.cashier),
                if (sale.customerName != null)
                  ReceiptRow('${context.t('sales.customer')}:', sale.customerName!),
                ReceiptRow(sale.modelLabel),
                ReceiptRow(sale.imei),
                ReceiptRow('${context.t('pos.totalDue')}:',
                    formatMoney(sale.salePrice), true),
                if (sale.warrantyEndsAt != null)
                  ReceiptRow('${context.t('pos.warrantyUntil')}:',
                      _fmt(sale.warrantyEndsAt!)),
              ],
              footerLines: [context.t('pos.thankYou')],
            ),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            icon: const Icon(Icons.add),
            label: Text(context.t('pos.newSale')),
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(posControllerProvider.notifier).dismissReceipt();
            },
          ),
        ],
      ),
    );
  }

  String _text(BuildContext context) => [
        context.t('pos.storeName'),
        '${context.t('pos.receiptNumber')}: ${sale.receiptId}',
        '${sale.modelLabel} (${sale.imei})',
        '${context.t('pos.totalDue')}: ${formatMoney(sale.salePrice)}',
        context.t('pos.thankYou'),
      ].join('\n');

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

  String _fmt(DateTime d) =>
      '${d.year}-${_pad(d.month)}-${_pad(d.day)} ${_pad(d.hour)}:${_pad(d.minute)}';
  String _pad(int n) => n.toString().padLeft(2, '0');
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
