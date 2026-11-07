import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import type { DeviceModelView } from '../device-models/types/device-model.types.js';
import {
  appleModelNumber,
  boxCodeKey,
  imeiTac,
  samsungModelCodeKey,
} from './lib/code-normalize.js';
import {
  linkKey,
  matchAttributeOption,
  modelMatchKey,
} from './lib/product-match.js';
import {
  LookupRepository,
  type SamsungModelCodeRow,
} from './lookup.repository.js';
import type {
  LookupMatch,
  LookupProduct,
  LookupReference,
  LookupResult,
  LookupSearchResult,
  LookupSource,
  LookupVariant,
} from './types/lookup.types.js';

const APPLE_SOURCE: LookupSource = {
  name: 'The Apple Wiki',
  license: 'CC BY-SA 4.0',
};
const TAC_SOURCE: LookupSource = {
  name: 'tac-database (github.com/MoazEb)',
  license: 'MIT',
};
const SAMSUNG_SOURCE: LookupSource = {
  name: 'Google Play supported devices',
  license: 'Public',
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
    if (tac) return this.lookupTac(tac, code);

    const aNumber = appleModelNumber(code);
    if (aNumber) {
      const appleResult = await this.lookupAppleModelNumber(aNumber);
      if (appleResult) return appleResult;
    }

    const samsungKey = samsungModelCodeKey(code);
    const samsungRow = await this.repo.findSamsungModelCode(samsungKey);
    if (samsungRow) return this.buildSamsungResult(samsungRow);

    const boxKey = boxCodeKey(code);
    const boxRow = await this.repo.findBoxCode(boxKey);
    if (boxRow) {
      const reference: LookupReference = {
        brand: boxRow.brand,
        model: boxRow.model,
        color: boxRow.color,
        storage: boxRow.storage,
        ram: boxRow.ram,
        modelCode: boxKey,
      };
      return this.withProduct(APPLE_SOURCE, reference, boxKey);
    }

    const directSamsung = await this.repo.findSamsungModelCode(
      code.toUpperCase(),
    );
    if (directSamsung) return this.buildSamsungResult(directSamsung);

    throw new NotFoundException(`No device known for code ${code}`);
  }

  async search(rawQuery: string): Promise<LookupSearchResult[]> {
    const query = rawQuery.trim();
    if (query.length < 2) return [];

    const [samsungRows, appleMatches] = await Promise.all([
      this.repo.searchSamsung(query, 8),
      this.repo.searchAppleModels(query, 8),
    ]);

    const appleDetailed = await Promise.all(
      appleMatches.map(async (m) => {
        const rows = await this.repo.findAppleModelOptions(m.model);
        const storageOptions = Array.from(
          new Set(
            rows.map((r) => r.storage).filter((s): s is string => Boolean(s)),
          ),
        );
        const colorOptions = Array.from(
          new Set(
            rows.map((r) => r.color).filter((c): c is string => Boolean(c)),
          ),
        );
        return {
          brand: m.brand,
          model: m.model,
          modelCode: m.modelNumber,
          kindCode: /iPad|Mac|Watch/i.test(m.model)
            ? ('SERIAL' as const)
            : ('IMEI' as const),
          storageOptions,
          colorOptions,
        };
      }),
    );

    const samsungDetailed = samsungRows.map((s) => ({
      brand: s.brand,
      model: s.model,
      series: s.series,
      modelCode: s.modelCode,
      kindCode: 'IMEI' as const,
      storageOptions: s.storageOptions ?? [],
      colorOptions: s.colorOptions ?? [],
    }));

    return [...samsungDetailed, ...appleDetailed].slice(0, 10);
  }

  private async lookupTac(tac: string, code: string): Promise<LookupResult> {
    const row = await this.repo.findTac(tac);
    if (!row) throw new NotFoundException(`No device known for IMEI ${code}`);
    const reference: LookupReference = {
      brand: row.brand,
      model: row.model,
      color: null,
      storage: null,
      ram: null,
    };
    return this.withProduct(TAC_SOURCE, reference, null);
  }

  private async lookupAppleModelNumber(
    aNumber: string,
  ): Promise<LookupResult | null> {
    const rows = await this.repo.findAppleModelNumbers(aNumber);
    if (rows.length === 0) return null;
    const storageOptions = Array.from(
      new Set(
        rows.map((r) => r.storage).filter((s): s is string => Boolean(s)),
      ),
    );
    const colorOptions = Array.from(
      new Set(rows.map((r) => r.color).filter((c): c is string => Boolean(c))),
    );
    const variants: LookupVariant[] = rows.map((r) => ({
      color: r.color,
      storage: r.storage,
      ram: r.ram,
      boxCode: r.boxCode,
    }));
    const reference: LookupReference = {
      brand: rows[0].brand,
      model: rows[0].model,
      color: colorOptions.length === 1 ? colorOptions[0] : null,
      storage: storageOptions.length === 1 ? storageOptions[0] : null,
      ram: rows[0].ram,
      modelNumber: aNumber,
      modelCode: aNumber,
      storageOptions,
      colorOptions,
      variants,
    };
    return this.withProduct(APPLE_SOURCE, reference, aNumber);
  }

  private buildSamsungResult(row: SamsungModelCodeRow): Promise<LookupResult> {
    const colors = row.colorOptions ?? [];
    const storages = row.storageOptions ?? [];
    const reference: LookupReference = {
      brand: row.brand,
      model: row.model,
      color: colors.length === 1 ? colors[0] : null,
      storage: storages.length === 1 ? storages[0] : null,
      ram: null,
      modelCode: row.modelCode,
      storageOptions: storages,
      colorOptions: colors,
    };
    return this.withProduct(SAMSUNG_SOURCE, reference, row.modelCode);
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
