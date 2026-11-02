import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/sync/connectivity.dart';
import '../../../../l10n/i18n.dart';
import '../../../../shared/ui/ui.dart';
import '../../application/expenses_providers.dart';
import '../../data/expense_categories_repository.dart';

/// Manage expense categories: list existing + add a new one (online-only).
/// Gated by `expense.category.manage` at the call site for the add action.
class ExpenseCategoriesDialog extends ConsumerStatefulWidget {
  const ExpenseCategoriesDialog({required this.canManage, super.key});

  final bool canManage;

  @override
  ConsumerState<ExpenseCategoriesDialog> createState() =>
      _ExpenseCategoriesDialogState();
}

class _ExpenseCategoriesDialogState
    extends ConsumerState<ExpenseCategoriesDialog> {
  final _name = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final name = _name.text.trim();
    if (name.isEmpty) return;
    final online = ref.read(connectivityProvider).valueOrNull ?? true;
    if (!online) {
      _toast(context.t('common.offline'));
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(expenseCategoriesRepositoryProvider).create(name: name);
      ref.invalidate(expenseCategoriesProvider);
      _name.clear();
      if (mounted) _toast(context.t('expenses.categorySaved'));
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _toast(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(expenseCategoriesProvider);
    return AlertDialog(
      title: Text(context.t('expenses.categories')),
      content: SizedBox(
        width: 360,
        child: categories.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorView(message: '$e'),
          data: (list) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final c in list)
                      ListTile(
                        dense: true,
                        title: Text(c.name),
                        subtitle: c.description == null
                            ? null
                            : Text(c.description!),
                      ),
                  ],
                ),
              ),
              if (widget.canManage) ...[
                const Divider(),
                Row(
                  children: [
                    Expanded(
                      child: AppFormField(
                        label: context.t('expenses.newCategory'),
                        controller: _name,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(top: 24),
                      child: FilledButton(
                        onPressed: _saving ? null : _add,
                        child: Text(context.t('common.add')),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(context.t('common.close')),
        ),
      ],
    );
  }
}
