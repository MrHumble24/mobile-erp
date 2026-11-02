import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/app_exception.dart';
import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../application/device_models_providers.dart';
import '../data/device_model.dart';
import '../data/device_model_repository.dart';
import 'attributes_editor.dart';

/// Create / edit a device model with its dynamic attribute schema. Rendered in
/// a bottom sheet; pops `true` on success so the caller can refresh.
class ModelFormSheet extends ConsumerStatefulWidget {
  const ModelFormSheet({this.model, super.key});

  final DeviceModelView? model;

  @override
  ConsumerState<ModelFormSheet> createState() => _ModelFormSheetState();
}

class _ModelFormSheetState extends ConsumerState<ModelFormSheet> {
  late final TextEditingController _brand =
      TextEditingController(text: widget.model?.brand ?? '');
  late final TextEditingController _name =
      TextEditingController(text: widget.model?.name ?? '');
  late bool _active = widget.model?.isActive ?? true;
  late List<AttributeDef> _attributes =
      List.of(widget.model?.attributes ?? const []);
  late final Set<String> _savedKeys =
      (widget.model?.attributes ?? const []).map((a) => a.key).toSet();

  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _brand.dispose();
    _name.dispose();
    super.dispose();
  }

  bool get _isEdit => widget.model != null;

  Future<void> _save() async {
    final brand = _brand.text.trim();
    final name = _name.text.trim();
    if (brand.isEmpty || name.isEmpty) {
      setState(() => _error = context.t('common.required'));
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = ref.read(deviceModelRepositoryProvider);
      if (_isEdit) {
        await repo.update(widget.model!.id,
            brand: brand, name: name, isActive: _active, attributes: _attributes);
      } else {
        await repo.create(brand: brand, name: name, attributes: _attributes);
      }
      ref.invalidate(deviceModelsProvider);
      if (mounted) Navigator.of(context).pop(true);
    } on AppException catch (e) {
      setState(() {
        _saving = false;
        _error = e.statusCode == 409
            ? context.t('inventory.modelDuplicate')
            : e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _isEdit
        ? context.t('inventory.editModel')
        : context.t('inventory.newModel');
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          AppFormField(label: context.t('inventory.brand'), controller: _brand),
          const SizedBox(height: 12),
          AppFormField(label: context.t('inventory.model'), controller: _name),
          if (_isEdit) ...[
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.t('inventory.modelActive')),
              value: _active,
              onChanged: (v) => setState(() => _active = v),
            ),
          ],
          const SizedBox(height: 12),
          AttributesEditor(
            attributes: _attributes,
            savedKeys: _savedKeys,
            onChanged: (next) => setState(() => _attributes = next),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
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
