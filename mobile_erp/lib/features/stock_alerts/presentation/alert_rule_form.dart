import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../device_models/device_models_module.dart';
import '../application/stock_alerts_providers.dart';
import '../data/stock_alert.dart';
import '../data/stock_alert_repository.dart';

const _fallbackStorages = ['64GB', '128GB', '256GB', '512GB', '1TB'];

/// Create / edit a stock-alert rule. On edit the model is fixed (the server
/// PATCH only changes storage + threshold). Pops `true` on success.
class AlertRuleForm extends ConsumerStatefulWidget {
  const AlertRuleForm({this.rule, super.key});

  final StockAlertRuleView? rule;

  @override
  ConsumerState<AlertRuleForm> createState() => _AlertRuleFormState();
}

class _AlertRuleFormState extends ConsumerState<AlertRuleForm> {
  late String? _modelId = widget.rule?.modelId;
  late String? _storage = widget.rule?.storage;
  late final TextEditingController _threshold =
      TextEditingController(text: '${widget.rule?.threshold ?? 1}');

  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _threshold.dispose();
    super.dispose();
  }

  bool get _isEdit => widget.rule != null;

  List<String> _storagesFor(List<DeviceModelView> models) {
    final matches = models.where((m) => m.id == _modelId);
    final opts = matches.isEmpty
        ? const <String>[]
        : matches.first.attributes
            .where((a) => a.key == 'storage')
            .expand((a) => a.options)
            .toList();
    return opts.isEmpty ? _fallbackStorages : opts;
  }

  Future<void> _save() async {
    final modelId = _modelId;
    final storage = _storage;
    final threshold = int.tryParse(_threshold.text.trim());
    if (modelId == null || storage == null || threshold == null || threshold < 0) {
      setState(() => _error = context.t('common.required'));
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = ref.read(stockAlertRepositoryProvider);
      if (_isEdit) {
        await repo.update(widget.rule!.id, storage: storage, threshold: threshold);
      } else {
        await repo.create(modelId: modelId, storage: storage, threshold: threshold);
      }
      ref.invalidate(stockAlertRulesProvider);
      ref.invalidate(lowStockProvider);
      if (mounted) Navigator.of(context).pop(true);
    } on AppException catch (e) {
      setState(() {
        _saving = false;
        _error = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final models = ref.watch(deviceModelsProvider).valueOrNull ?? const [];
    final storages = _storagesFor(models);
    final title = _isEdit
        ? context.t('inventory.editRule')
        : context.t('inventory.newRule');

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Text(context.t('inventory.model'),
              style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            initialValue: _modelId,
            isExpanded: true,
            items: [
              for (final m in models)
                DropdownMenuItem(value: m.id, child: Text(m.label)),
            ],
            onChanged: _isEdit ? null : (v) => setState(() => _modelId = v),
          ),
          const SizedBox(height: 12),
          Text(context.t('inventory.storage'),
              style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            initialValue: storages.contains(_storage) ? _storage : null,
            isExpanded: true,
            items: [
              for (final s in storages)
                DropdownMenuItem(value: s, child: Text(s)),
            ],
            onChanged: (v) => setState(() => _storage = v),
          ),
          const SizedBox(height: 12),
          AppFormField(
            label: context.t('inventory.threshold'),
            controller: _threshold,
            keyboardType: TextInputType.number,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving
                ? context.t('common.loading')
                : context.t('common.save')),
          ),
        ],
      ),
    );
  }
}
