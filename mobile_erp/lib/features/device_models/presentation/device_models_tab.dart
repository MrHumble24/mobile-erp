import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../../../theme/tokens.dart';
import '../application/device_models_providers.dart';
import '../data/device_model.dart';
import 'model_form_sheet.dart';

/// Models tab of the inventory page: searchable model list with create / edit.
/// Public entry point imported by the devices slice's inventory page.
class DeviceModelsTab extends ConsumerStatefulWidget {
  const DeviceModelsTab({super.key});

  @override
  ConsumerState<DeviceModelsTab> createState() => _DeviceModelsTabState();
}

class _DeviceModelsTabState extends ConsumerState<DeviceModelsTab> {
  String _query = '';

  Future<void> _openForm([DeviceModelView? model]) async {
    final saved = await showAppBottomSheet<bool>(
      context,
      builder: (_) => ModelFormSheet(model: model),
    );
    if (saved == true && mounted) {
      ref.invalidate(deviceModelsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final models = ref.watch(deviceModelsProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search),
                    hintText:
                        '${context.t('inventory.brand')} / ${context.t('inventory.model')}...',
                  ),
                  onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: _openForm,
                icon: const Icon(Icons.add, size: 18),
                label: Text(context.t('inventory.newModel')),
              ),
            ],
          ),
        ),
        Expanded(
          child: models.when(
            loading: () => const Loading(),
            error: (e, _) => ErrorView(
              message: e.toString(),
              onRetry: () => ref.invalidate(deviceModelsProvider),
              retryLabel: context.t('common.retry'),
            ),
            data: (list) => _ModelsList(models: _filter(list), onEdit: _openForm),
          ),
        ),
      ],
    );
  }

  List<DeviceModelView> _filter(List<DeviceModelView> list) {
    if (_query.isEmpty) return list;
    return list.where((m) => m.label.toLowerCase().contains(_query)).toList();
  }
}

class _ModelsList extends StatelessWidget {
  const _ModelsList({required this.models, required this.onEdit});

  final List<DeviceModelView> models;
  final ValueChanged<DeviceModelView> onEdit;

  @override
  Widget build(BuildContext context) {
    if (models.isEmpty) {
      return EmptyView(message: context.t('inventory.empty'));
    }
    return ListView.separated(
      itemCount: models.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final m = models[i];
        return AppCard(
          onTap: () => onEdit(m),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.label,
                        style: Theme.of(context).textTheme.titleMedium),
                    Text(
                      '${m.attributes.length} ${context.t('inventory.attrSectionTitle').toLowerCase()}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusChip(
                m.isActive ? context.t('common.yes') : context.t('common.no'),
                color: m.isActive ? AppColors.success : AppColors.ash,
              ),
            ],
          ),
        );
      },
    );
  }
}
