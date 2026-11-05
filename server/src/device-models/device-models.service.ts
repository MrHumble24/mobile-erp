import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { DeviceModelsRepository } from './device-models.repository.js';
import { CreateDeviceModelDto } from './dto/create-device-model.dto.js';
import { UpdateDeviceModelDto } from './dto/update-device-model.dto.js';
import {
  AttributeDef,
  defaultAttributes,
  normalizeAttributes,
} from './lib/attribute-schema.js';
import { DeviceModelView } from './types/device-model.types.js';

@Injectable()
export class DeviceModelsService {
  constructor(private readonly repo: DeviceModelsRepository) {}

  list(): Promise<DeviceModelView[]> {
    return this.repo.findAll();
  }

  get(id: string): Promise<DeviceModelView> {
    return this.require(id);
  }

  /** Effective spec schema for a model; consumed by intake/edit validation. */
  async getAttributes(id: string): Promise<AttributeDef[]> {
    return (await this.require(id)).attributes;
  }

  async create(dto: CreateDeviceModelDto): Promise<DeviceModelView> {
    const attributes = dto.attributes
      ? normalizeAttributes(dto.attributes)
      : defaultAttributes();
    try {
      return await this.repo.create({
        brand: dto.brand,
        name: dto.name,
        customsCode: dto.customsCode,
        attributes,
      });
    } catch (error) {
      throw this.mapConflict(error, dto.brand, dto.name);
    }
  }

  async update(
    id: string,
    dto: UpdateDeviceModelDto,
  ): Promise<DeviceModelView> {
    await this.require(id);
    const attributes = dto.attributes
      ? normalizeAttributes(dto.attributes)
      : undefined;
    try {
      return await this.repo.update(id, {
        brand: dto.brand,
        name: dto.name,
        isActive: dto.isActive,
        customsCode: dto.customsCode,
        attributes,
      });
    } catch (error) {
      throw this.mapConflict(error, dto.brand, dto.name);
    }
  }

  private mapConflict(error: unknown, brand?: string, name?: string): unknown {
    if (isUniqueViolation(error)) {
      return new ConflictException(
        `Model "${[brand, name].filter(Boolean).join(' ')}" already exists`,
      );
    }
    return error;
  }

  private async require(id: string): Promise<DeviceModelView> {
    const model = await this.repo.findById(id);
    if (!model) throw new NotFoundException(`Device model ${id} not found`);
    return model;
  }
}
