/// One device staged for batch intake, before it is POSTed to
/// `/shipments/:id/devices`. Costs are entered by the operator (writes, not
/// redacted reads), so they are plain required numbers here.
class IntakeDraft {
  const IntakeDraft({
    required this.imei,
    required this.modelId,
    required this.specs,
    required this.acquisitionCost,
    this.targetPrice,
  });

  final String imei;
  final String modelId;
  final Map<String, dynamic> specs;
  final num acquisitionCost;
  final num? targetPrice;

  /// The exact DTO shape the server expects per device.
  Map<String, dynamic> toJson() => {
        'imei': imei,
        'modelId': modelId,
        'specs': specs,
        'acquisitionCost': acquisitionCost,
        if (targetPrice != null) 'targetPrice': targetPrice,
      };
}
