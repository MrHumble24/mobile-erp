import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { validateSpecs } from '../../device-models/lib/attribute-schema.js';
import type { DeviceModelView } from '../../device-models/types/device-model.types.js';
import { assertUnitKind } from '../../devices/lib/unit-code.js';
import type { RegisterDeviceDto } from '../dto/register-devices.dto.js';

export function assertKindRules(
  devices: RegisterDeviceDto[],
  models: DeviceModelView[],
): void {
  const kindById = new Map(models.map((m) => [m.id, m.kindCode]));
  for (const d of devices) {
    assertUnitKind(kindById.get(d.modelId) ?? 'IMEI', d);
  }
}

export function assertSpecs(
  devices: RegisterDeviceDto[],
  models: DeviceModelView[],
): void {
  const attrsById = new Map(models.map((m) => [m.id, m.attributes]));
  const problems = devices.flatMap((d) =>
    validateSpecs(attrsById.get(d.modelId) ?? [], d.specs).map((p) => ({
      imei: d.imei ?? d.serialNumber ?? null,
      ...p,
    })),
  );
  if (problems.length > 0) {
    throw new BadRequestException({ message: 'Invalid specs', problems });
  }
}

export function assertExpensePermission(
  hasNonZeroExpense: boolean,
  user: AuthenticatedUser,
): void {
  if (hasNonZeroExpense && !user.permissions.has('device.expense')) {
    throw new ForbiddenException(
      'device.expense permission required to set a unit expense',
    );
  }
}
