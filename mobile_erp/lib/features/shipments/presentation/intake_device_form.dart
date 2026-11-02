import 'package:flutter/material.dart';

import '../../../l10n/i18n.dart';
import '../../../shared/ui/ui.dart';
import '../data/device_model.dart';
import '../data/intake_draft.dart';

/// Sticky model + specs + cost, with a [ScannerField] that adds one unit per
/// scan (model/specs/cost persist for the next unit — the intake loop). Calls
/// [onAdd] with a validated [IntakeDraft]; the IMEI field clears and refocuses.
class IntakeDeviceForm extends StatefulWidget {
  const IntakeDeviceForm({required this.models, required this.onAdd, super.key});

  final List<DeviceModel> models;
  final ValueChanged<IntakeDraft> onAdd;

  @override
  State<IntakeDeviceForm> createState() => _IntakeDeviceFormState();
}

class _IntakeDeviceFormState extends State<IntakeDeviceForm> {
  String? _modelId;
  final _specs = <String, String>{};
  final _cost = TextEditingController();
  final _target = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _cost.dispose();
    _target.dispose();
    super.dispose();
  }

  DeviceModel? get _model {
    for (final m in widget.models) {
      if (m.id == _modelId) return m;
    }
    return null;
  }

  void _onModelChanged(String? id) {
    setState(() {
      _modelId = id;
      _specs.clear();
    });
  }

  void _add(String imei) {
    final model = _model;
    final error = _validate(imei, model);
    if (error != null) {
      setState(() => _error = error);
      return;
    }
    widget.onAdd(IntakeDraft(
      imei: imei,
      modelId: model!.id,
      specs: Map<String, dynamic>.from(_specs),
      acquisitionCost: num.parse(_cost.text.trim()),
      targetPrice: num.tryParse(_target.text.trim()),
    ));
    setState(() {
      _error = null;
      _cost.clear();
    });
  }

  String? _validate(String imei, DeviceModel? model) {
    if (!RegExp(r'^\d{15}$').hasMatch(imei)) {
      return context.t('shipments.imeiLength');
    }
    if (model == null) return context.t('shipments.selectModel');
    final cost = num.tryParse(_cost.text.trim());
    if (cost == null || cost < 0) return context.t('shipments.acquisitionCost');
    for (final attr in model.attributes) {
      if (attr.required && (_specs[attr.key]?.trim().isEmpty ?? true)) {
        return context.t('shipments.invalidSpecs');
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final model = _model;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DropdownButtonFormField<String>(
          initialValue: _modelId,
          decoration: InputDecoration(labelText: context.t('shipments.selectModel')),
          items: [
            for (final m in widget.models)
              DropdownMenuItem(value: m.id, child: Text(m.label)),
          ],
          onChanged: _onModelChanged,
        ),
        if (model != null)
          for (final attr in model.attributes) ...[
            const SizedBox(height: 12),
            _SpecField(
              attr: attr,
              value: _specs[attr.key],
              onChanged: (v) => _specs[attr.key] = v,
            ),
          ],
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AppFormField(
                label: context.t('shipments.acquisitionCost'),
                controller: _cost,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppFormField(
                label: context.t('shipments.targetPrice'),
                controller: _target,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(context.t('shipments.scanImei'),
            style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        ScannerField(
          hintText: context.t('shipments.scanImei'),
          onScan: _add,
        ),
        if (_error != null) ...[
          const SizedBox(height: 10),
          Text(_error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
      ],
    );
  }
}

/// One spec input, chosen by attribute type (select → dropdown, else text).
class _SpecField extends StatelessWidget {
  const _SpecField({required this.attr, required this.value, required this.onChanged});

  final AttributeDef attr;
  final String? value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final label = attr.required ? '${attr.label} *' : attr.label;
    if (attr.type == 'select' && attr.options.isNotEmpty) {
      return DropdownButtonFormField<String>(
        initialValue: value,
        decoration: InputDecoration(labelText: label),
        items: [
          for (final o in attr.options)
            DropdownMenuItem(value: o, child: Text(o)),
        ],
        onChanged: (v) => onChanged(v ?? ''),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        TextField(
          keyboardType:
              attr.type == 'number' ? TextInputType.number : null,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
