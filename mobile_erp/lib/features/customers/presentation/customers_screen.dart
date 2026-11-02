import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/customers_providers.dart';
import '../data/customer_models.dart';
import 'customer_details_sheet.dart';
import 'customer_form_dialog.dart';

/// Searchable customer list. A row opens the details drawer; the action button
/// opens the new-customer dialog.
class CustomersScreen extends ConsumerWidget {
  const CustomersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customers = ref.watch(customersProvider);
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: AppFormField(
              label: context.t('sales.customersTitle'),
              hintText: context.t('common.search'),
              onFieldSubmitted: (v) =>
                  ref.read(customerQueryProvider.notifier).set(v.trim()),
            ),
          ),
          Expanded(
            child: customers.when(
              loading: () => const Loading(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(customersProvider),
                retryLabel: context.t('common.retry'),
              ),
              data: (rows) => rows.isEmpty
                  ? EmptyView(
                      icon: Icons.people_outline,
                      message: context.t('sales.noCustomersFound'),
                    )
                  : ListView.separated(
                      itemCount: rows.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (_, i) => _CustomerTile(customer: rows[i]),
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.person_add_alt),
        label: Text(context.t('sales.newCustomer')),
        onPressed: () => showCustomerFormDialog(context),
      ),
    );
  }
}

class _CustomerTile extends StatelessWidget {
  const _CustomerTile({required this.customer});
  final Customer customer;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.person_outline),
      title: Text(customer.name),
      subtitle: customer.phone == null ? null : Text(customer.phone!),
      onTap: () => showCustomerDetailsSheet(context, customer),
    );
  }
}
