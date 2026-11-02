import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../data/sync/connectivity.dart';
import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/expenses_providers.dart';
import '../../data/expenses_repository.dart';

final _dateFmt = DateFormat('dd.MM.yyyy');

/// Online-only "Log expense" form. When offline it refuses (expenses are not
/// in the offline outbox) and tells the user to reconnect.
class NewExpenseDialog extends ConsumerStatefulWidget {
  const NewExpenseDialog({super.key});

  @override
  ConsumerState<NewExpenseDialog> createState() => _NewExpenseDialogState();
}

class _NewExpenseDialogState extends ConsumerState<NewExpenseDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _description = TextEditingController();
  String? _categoryId;
  bool _isRecurring = false;
  DateTime _incurredAt = DateTime.now();
  bool _saving = false;

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _categoryId == null) return;
    final online = ref.read(connectivityProvider).valueOrNull ?? true;
    if (!online) {
      _toast(context.t('common.offline'));
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(expensesRepositoryProvider).create(
            categoryId: _categoryId!,
            amount: num.tryParse(_amount.text.trim()) ?? 0,
            description: _description.text.trim(),
            isRecurring: _isRecurring,
            incurredAt: _incurredAt,
          );
      invalidateExpenses(ref);
      if (mounted) {
        _toast(context.t('expenses.expenseSaved'));
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() => _saving = false);
      if (mounted) _toast('$e');
    }
  }

  void _toast(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(expenseCategoriesProvider).valueOrNull ?? [];
    return AlertDialog(
      title: Text(context.t('expenses.newExpense')),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                initialValue: _categoryId,
                isExpanded: true,
                decoration:
                    InputDecoration(labelText: context.t('expenses.category')),
                items: [
                  for (final c in categories)
                    DropdownMenuItem(value: c.id, child: Text(c.name)),
                ],
                validator: (v) =>
                    v == null ? context.t('common.required') : null,
                onChanged: (v) => setState(() => _categoryId = v),
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('expenses.amount'),
                controller: _amount,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) {
                  final n = num.tryParse((v ?? '').trim());
                  if (n == null || n < 0) return context.t('common.required');
                  return null;
                },
              ),
              const SizedBox(height: 12),
              AppFormField(
                label: context.t('expenses.description'),
                controller: _description,
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.t('expenses.isRecurring')),
                value: _isRecurring,
                onChanged: (v) => setState(() => _isRecurring = v),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.t('expenses.incurredAt')),
                subtitle: Text(_dateFmt.format(_incurredAt)),
                trailing: const Icon(Icons.calendar_today, size: 18),
                onTap: _pickDate,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(),
          child: Text(context.t('common.cancel')),
        ),
        FilledButton(
          onPressed: _saving ? null : _submit,
          child: Text(context.t('common.save')),
        ),
      ],
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _incurredAt,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _incurredAt = picked);
  }
}
