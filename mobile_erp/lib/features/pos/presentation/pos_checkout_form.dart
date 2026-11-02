import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import 'package:mobile_erp/shared/lib/money.dart';
import '../../../shared/ui/ui.dart';
import '../application/pos_controller.dart';
import '../data/pos_models.dart';

/// Checkout form: sale price (prefilled from target), an optional inline new
/// customer, warranty days (prefilled from settings), and notes. Submitting
/// runs [PosController.checkout], which writes online or queues offline.
class PosCheckoutForm extends ConsumerStatefulWidget {
  const PosCheckoutForm({required this.device, super.key});

  final ScannedDevice device;

  @override
  ConsumerState<PosCheckoutForm> createState() => _PosCheckoutFormState();
}

class _PosCheckoutFormState extends ConsumerState<PosCheckoutForm> {
  final _formKey = GlobalKey<FormState>();
  final _price = TextEditingController();
  final _warranty = TextEditingController();
  final _customerName = TextEditingController();
  final _customerPhone = TextEditingController();
  final _notes = TextEditingController();
  bool _addCustomer = false;
  bool _warrantyPrefilled = false;

  @override
  void initState() {
    super.initState();
    _price.text = widget.device.targetPrice ?? '';
  }

  @override
  void dispose() {
    _price.dispose();
    _warranty.dispose();
    _customerName.dispose();
    _customerPhone.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() != true) return;
    final days = int.tryParse(_warranty.text.trim());
    ref.read(posControllerProvider.notifier).checkout(
          salePrice: _price.text.trim(),
          customerName: _addCustomer ? _customerName.text.trim() : null,
          customerPhone: _addCustomer ? _customerPhone.text.trim() : null,
          warrantyDays: days,
          notes: _notes.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    // Prefill warranty once settings load.
    ref.listen(defaultWarrantyDaysProvider, (_, next) {
      final v = next.valueOrNull;
      if (v != null && !_warrantyPrefilled && _warranty.text.isEmpty) {
        _warranty.text = '$v';
        _warrantyPrefilled = true;
      }
    });
    final busy = ref.watch(posControllerProvider).busy;

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppFormField(
            label: context.t('pos.salePrice'),
            controller: _price,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            enabled: !busy,
            validator: (v) => parseMoney(v).toDouble() <= 0
                ? context.t('common.required')
                : null,
          ),
          const SizedBox(height: 12),
          AppFormField(
            label: context.t('pos.warrantyDays'),
            controller: _warranty,
            keyboardType: TextInputType.number,
            enabled: !busy,
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(context.t('pos.newCustomer')),
            value: _addCustomer,
            onChanged: busy ? null : (v) => setState(() => _addCustomer = v),
          ),
          if (_addCustomer) ...[
            AppFormField(
              label: context.t('pos.customerName'),
              controller: _customerName,
              enabled: !busy,
              validator: (v) => _addCustomer && (v == null || v.trim().isEmpty)
                  ? context.t('common.required')
                  : null,
            ),
            const SizedBox(height: 12),
            AppFormField(
              label: context.t('pos.customerPhone'),
              controller: _customerPhone,
              keyboardType: TextInputType.phone,
              enabled: !busy,
            ),
            const SizedBox(height: 12),
          ],
          AppFormField(
            label: context.t('pos.notes'),
            controller: _notes,
            enabled: !busy,
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            icon: const Icon(Icons.check_circle_outline),
            label: Text(busy
                ? context.t('pos.completingSale')
                : context.t('pos.checkoutButton')),
            onPressed: busy ? null : _submit,
          ),
        ],
      ),
    );
  }
}
