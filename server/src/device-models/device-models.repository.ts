import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDeviceModelDto } from './dto/create-device-model.dto.js';
import {
  DeviceModelPatch,
  DeviceModelView,
} from './types/device-model.types.js';

/** All Prisma access for the device-model catalog. */
@Injectable()
export class DeviceModelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<DeviceModelView[]> {
    return this.prisma.deviceModel.findMany({
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string): Promise<DeviceModelView | null> {
    return this.prisma.deviceModel.findUnique({ where: { id } });
  }

  create(input: CreateDeviceModelDto): Promise<DeviceModelView> {
    return this.prisma.deviceModel.create({ data: input });
  }

  update(id: string, data: DeviceModelPatch): Promise<DeviceModelView> {
    return this.prisma.deviceModel.update({ where: { id }, data });
  }
}
