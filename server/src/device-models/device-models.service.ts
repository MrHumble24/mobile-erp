import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isUniqueViolation,
  uniqueViolationFields,
} from '../common/lib/prisma-errors.js';
import { ProductCategoriesService } from '../product-categories/product-categories.service.js';
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
  constructor(
    private readonly repo: DeviceModelsRepository,
    private readonly categories: ProductCategoriesService,
  ) {}

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
    const kindCode = dto.kindCode ?? 'IMEI';
    await this.assertKind(kindCode);
    if (dto.categoryId) await this.categories.require(dto.categoryId);
    const attributes = dto.attributes
      ? normalizeAttributes(dto.attributes)
      : defaultAttributes();
    try {
      return await this.repo.create({
        brand: dto.brand,
        name: dto.name,
        kindCode,
        categoryId: dto.categoryId,
        barcode: dto.barcode,
        modelCode: dto.modelCode,
        customsCode: dto.customsCode,
        salePrice: dto.salePrice,
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
    const current = await this.require(id);
    if (dto.kindCode && dto.kindCode !== current.kindCode) {
      await this.assertKind(dto.kindCode);
      if ((await this.repo.countUnits(id)) > 0) {
        throw new ConflictException(
          'Cannot change the kind of a model that already has units',
        );
      }
    }
    if (dto.categoryId) await this.categories.require(dto.categoryId);
    const attributes = dto.attributes
      ? normalizeAttributes(dto.attributes)
      : undefined;
    try {
      return await this.repo.update(id, {
        brand: dto.brand,
        name: dto.name,
        isActive: dto.isActive,
        kindCode: dto.kindCode,
        categoryId: dto.categoryId,
        barcode: dto.barcode,
        modelCode: dto.modelCode,
        customsCode: dto.customsCode,
        salePrice: dto.salePrice,
        attributes,
      });
    } catch (error) {
      throw this.mapConflict(error, dto.brand, dto.name);
    }
  }

  private async assertKind(kindCode: string): Promise<void> {
    if (!(await this.repo.kindIsActive(kindCode))) {
      throw new BadRequestException(`Unknown or inactive kind ${kindCode}`);
    }
  }

  private mapConflict(error: unknown, brand?: string, name?: string): unknown {
    if (uniqueViolationFields(error).includes('barcode')) {
      return new ConflictException('Barcode already in use');
    }
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
