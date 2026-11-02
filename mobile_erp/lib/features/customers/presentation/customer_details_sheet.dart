import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/customers_providers.dart';
import '../data/customer_models.dart';

/// Customer details drawer with purchase history (`GET /customers/:id/sales`).
void showCustomerDetailsSheet(BuildContext context, Customer customer) =>
    showAppBottomSheet<void>(
      context,
      builder: (_) => _Details(customer: customer),
    );

class _Details extends ConsumerWidget {
  const _Details({required this.customer});
  final Customer customer;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sales = ref.watch(customerSalesProvider(customer.id));
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(customer.name, style: Theme.of(context).textTheme.titleLarge),
          if (customer.phone != null) Text(customer.phone!),
          if (customer.notes != null) ...[
            const SizedBox(height: 4),
            Text(customer.notes!,
                style: Theme.of(context).textTheme.bodySmall),
          ],
          const SizedBox(height: 16),
          Text(context.t('sales.customerSalesHistory'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Flexible(
            child: sales.when(
              loading: () => const Loading(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () =>
                    ref.invalidate(customerSalesProvider(customer.id)),
                retryLabel: context.t('common.retry'),
              ),
              data: (rows) => rows.isEmpty
                  ? EmptyView(message: context.t('sales.noSalesFound'))
                  : ListView.separated(
                      shrinkWrap: true,
                      itemCount: rows.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (_, i) => _SaleTile(sale: rows[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SaleTile extends StatelessWidget {
  const _SaleTile({required this.sale});
  final CustomerSale sale;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(sale.modelLabel),
      subtitle: Text(sale.imei),
      trailing: Text(formatMoney(sale.salePrice)),
    );
  }
}
