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
import { ImageStorageService } from './image-storage.service.js';
import {
  AttributeDef,
  defaultAttributes,
  normalizeAttributes,
} from './lib/attribute-schema.js';
import { assertValidImage } from './lib/image-file.js';
import { DeviceModelView } from './types/device-model.types.js';

@Injectable()
export class DeviceModelsService {
  constructor(
    private readonly repo: DeviceModelsRepository,
    private readonly categories: ProductCategoriesService,
    private readonly images: ImageStorageService,
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

  /**
   * Replaces the product picture: validates the bytes (JPEG/PNG/WebP by magic
   * number, ≤ 2 MB), writes a fresh random file, points the model at it and
   * deletes the old file. The DB points at the new file before the old one is
   * removed, so a crash leaves an orphan file, never a broken link.
   */
  async setImage(
    id: string,
    buffer: Buffer | undefined,
  ): Promise<DeviceModelView> {
    await this.require(id);
    const ext = assertValidImage(buffer);
    const previous = await this.repo.imageFileName(id);
    const fileName = await this.images.save(buffer!, ext);
    const view = await this.repo.update(id, { imageFileName: fileName });
    await this.images.remove(previous);
    return view;
  }

  /** Removes the product picture (deletes the file; no-op if it has none). */
  async removeImage(id: string): Promise<DeviceModelView> {
    await this.require(id);
    const previous = await this.repo.imageFileName(id);
    const view = await this.repo.update(id, { imageFileName: null });
    await this.images.remove(previous);
    return view;
  }

  /**
   * Sets or replaces the picture for a specific color of a model.
   * Validates bytes (JPEG/PNG/WebP, <= 2 MB), saves to disk, upserts DB row,
   * and deletes previous file if present.
   */
  async setColorImage(
    id: string,
    color: string,
    buffer: Buffer | undefined,
  ): Promise<DeviceModelView> {
    const trimmedColor = color?.trim();
    if (!trimmedColor) {
      throw new BadRequestException('Color cannot be empty');
    }
    await this.require(id);
    const ext = assertValidImage(buffer);
    const previous = await this.repo.colorImageFileName(id, trimmedColor);
    const fileName = await this.images.save(buffer!, ext);
    const view = await this.repo.setColorImage(id, trimmedColor, fileName);
    await this.images.remove(previous);
    return view;
  }

  /** Removes the picture for a specific color of a model. */
  async removeColorImage(id: string, color: string): Promise<DeviceModelView> {
    const trimmedColor = color?.trim();
    if (!trimmedColor) {
      throw new BadRequestException('Color cannot be empty');
    }
    await this.require(id);
    const previous = await this.repo.colorImageFileName(id, trimmedColor);
    const view = await this.repo.removeColorImage(id, trimmedColor);
    await this.images.remove(previous);
    return view;
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
