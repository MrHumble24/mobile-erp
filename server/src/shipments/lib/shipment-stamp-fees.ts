import type { DeviceModelView } from '../../device-models/types/device-model.types.js';
import { normalizeSerial } from '../../devices/lib/unit-code.js';
import { matchCustomsFee } from '../../customs/lib/customs-match.js';
import type { RegisterDeviceDto } from '../dto/register-devices.dto.js';
import type { RegisterDeviceInput } from '../types/shipment.types.js';

/** Stamp each device with the current list's fee for its model's customsCode + storage. */
export function stampCustomsFees(
  devices: RegisterDeviceDto[],
  models: DeviceModelView[],
  feeByCode: Map<string, number>,
): RegisterDeviceInput[] {
  const byModel = new Map(models.map((m) => [m.id, m]));
  return devices.map((d) => {
    const model = byModel.get(d.modelId)!;
    const storage =
      typeof d.specs?.storage === 'string' ? d.specs.storage : undefined;
    const customsFee = matchCustomsFee(feeByCode, model.customsCode, storage);
    return {
      ...d,
      kindCode: model.kindCode,
      serialNumber: d.serialNumber
        ? normalizeSerial(d.serialNumber)
        : undefined,
      customsFee,
    };
  });
}
