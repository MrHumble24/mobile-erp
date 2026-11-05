import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import type { DeviceModelView } from '../device-models/types/device-model.types.js';
import { boxCodeKey, imeiTac } from './lib/code-normalize.js';
import {
  linkKey,
  matchAttributeOption,
  modelMatchKey,
} from './lib/product-match.js';
import { LookupRepository } from './lookup.repository.js';
import type {
  LookupMatch,
  LookupProduct,
  LookupReference,
  LookupResult,
  LookupSource,
} from './types/lookup.types.js';

const APPLE_SOURCE: LookupSource = {
  name: 'The Apple Wiki',
  license: 'CC BY-SA 4.0',
};
const TAC_SOURCE: LookupSource = {
  name: 'tac-database (github.com/MoazEb)',
  license: 'MIT',
};

/**
 * Identifies a scanned/typed code from the reference lists and, when it can,
 * names our catalog product for it so intake can preselect it (ADR 0031).
 */
@Injectable()
export class LookupService {
  constructor(
    private readonly repo: LookupRepository,
    private readonly deviceModels: DeviceModelsService,
  ) {}

  async lookup(rawCode: string): Promise<LookupResult> {
    const code = rawCode.trim();
    const tac = imeiTac(code);
    if (tac) {
      const row = await this.repo.findTac(tac);
      if (!row) throw new NotFoundException(`No device known for IMEI ${code}`);
      const reference: LookupReference = {
        brand: row.brand,
        model: row.model,
        color: null,
        storage: null,
        ram: null,
      };
      // An IMEI carries no maker model code, so no modelCode match.
      return this.withProduct(TAC_SOURCE, reference, null);
    }

    const key = boxCodeKey(code);
    const row = await this.repo.findBoxCode(key);
    if (!row) throw new NotFoundException(`No device known for code ${code}`);
    const reference: LookupReference = {
      brand: row.brand,
      model: row.model,
      color: row.color,
      storage: row.storage,
      ram: row.ram,
    };
    return this.withProduct(APPLE_SOURCE, reference, key);
  }

  /** Stores (or replaces) the shop's link from a reference model to a product. */
  async learnLink(
    refBrand: string,
    refModel: string,
    modelId: string,
  ): Promise<{ refBrand: string; refModel: string; modelId: string }> {
    await this.deviceModels.get(modelId); // 404 if the product is missing
    await this.repo.upsertLink(
      linkKey(refBrand, refModel),
      refBrand,
      refModel,
      modelId,
    );
    return { refBrand, refModel, modelId };
  }

  private async withProduct(
    source: LookupSource,
    reference: LookupReference,
    makerCode: string | null,
  ): Promise<LookupResult> {
    return {
      source,
      reference,
      product: await this.nameProduct(reference, makerCode),
    };
  }

  private async nameProduct(
    reference: LookupReference,
    makerCode: string | null,
  ): Promise<LookupProduct | null> {
    const models = await this.deviceModels.list();
    const linkId = await this.repo.findLinkModelId(
      linkKey(reference.brand, reference.model),
    );
    const match = findMatch(models, reference, makerCode, linkId);
    if (!match) return null;
    return {
      modelId: match.model.id,
      brand: match.model.brand,
      name: match.model.name,
      kindCode: match.model.kindCode,
      matchedBy: match.matchedBy,
      storageOption: matchAttributeOption(
        match.model.attributes,
        'storage',
        reference.storage,
      ),
      colorOption: matchAttributeOption(
        match.model.attributes,
        'color',
        reference.color,
      ),
    };
  }
}

/**
 * Names our product in order: a link the shop taught, else a modelCode equal to
 * the (Apple) code, else brand+name equal to the reference ignoring case,
 * spacing and a leading brand word.
 */
function findMatch(
  models: DeviceModelView[],
  reference: LookupReference,
  makerCode: string | null,
  linkId: string | null,
): { model: DeviceModelView; matchedBy: LookupMatch } | null {
  if (linkId) {
    const model = models.find((m) => m.id === linkId);
    if (model) return { model, matchedBy: 'link' };
  }
  if (makerCode) {
    const model = models.find(
      (m) => (m.modelCode ?? '').toUpperCase() === makerCode,
    );
    if (model) return { model, matchedBy: 'modelCode' };
  }
  const refKey = modelMatchKey(reference.brand, reference.model);
  const model = models.find((m) => modelMatchKey(m.brand, m.name) === refKey);
  return model ? { model, matchedBy: 'name' } : null;
}
