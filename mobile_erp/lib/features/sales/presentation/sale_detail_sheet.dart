import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../data/sale_models.dart';
import 'receipt_view.dart';
import 'return_dialog.dart';

/// Detail view for one sale, opened from a list row. Links to the printable
/// receipt and the return flow. Redacted cost/profit are shown only if present.
void showSaleDetailSheet(BuildContext context, SaleView sale) =>
    showAppBottomSheet<void>(
      context,
      builder: (_) => _SaleDetail(sale: sale),
    );

class _SaleDetail extends StatelessWidget {
  const _SaleDetail({required this.sale});
  final SaleView sale;

  @override
  Widget build(BuildContext context) {
    final retail = sale.channel == SaleChannel.retail;
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('${sale.device.model.label} · ${sale.device.imei}',
                    style: Theme.of(context).textTheme.titleMedium),
              ),
              StatusChip(
                retail
                    ? context.t('sales.channelRetail')
                    : context.t('sales.channelB2B'),
                color: retail ? AppColors.signalBlue : AppColors.warning,
              ),
            ],
          ),
          const SizedBox(height: 12),
          _kv(context, context.t('sales.salePrice'), formatMoney(sale.salePrice)),
          if (sale.netProfit != null)
            _kv(context, context.t('sales.netProfit'), formatMoney(sale.netProfit)),
          if (sale.customer != null)
            _kv(context, context.t('sales.customer'), sale.customer!.name),
          _kv(context, context.t('sales.soldBy'), sale.soldBy.name),
          if (sale.soldAt != null)
            _kv(context, context.t('sales.soldAt'), _fmt(sale.soldAt!)),
          if (sale.warranty != null)
            _kv(context, context.t('pos.warrantyDays'), '${sale.warranty!.days}'),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.receipt_long),
                  label: Text(context.t('sales.receipt')),
                  onPressed: () => showAppBottomSheet<void>(
                    context,
                    builder: (_) => SizedBox(
                      height: MediaQuery.sizeOf(context).height * 0.8,
                      child: ReceiptViewPanel(saleId: sale.id),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  icon: const Icon(Icons.assignment_return),
                  label: Text(context.t('sales.returnDevice')),
                  onPressed: () => showReturnDialog(context, sale.id),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kv(BuildContext context, String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [Text(k), Flexible(child: Text(v, textAlign: TextAlign.right))],
        ),
      );

  String _fmt(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
