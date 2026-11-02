import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { CreateLookupDto, UpdateLookupDto } from './dto/lookup.dto.js';
import { QcLookupsRepository } from './qc-lookups.repository.js';
import { LookupView } from './types/qc.types.js';

/** CRUD for the two QC lookups. Codes are immutable; entries deactivate, never delete. */
@Injectable()
export class QcLookupsService {
  constructor(private readonly repo: QcLookupsRepository) {}

  listDefectTypes(includeInactive = false): Promise<LookupView[]> {
    return this.repo.listDefectTypes(includeInactive);
  }

  listGrades(includeInactive = false): Promise<LookupView[]> {
    return this.repo.listGrades(includeInactive);
  }

  async createDefectType(dto: CreateLookupDto): Promise<LookupView> {
    return this.guard(
      () => this.repo.createDefectType(dto),
      `Defect type ${dto.code} already exists`,
    );
  }

  async createGrade(dto: CreateLookupDto): Promise<LookupView> {
    return this.guard(
      () => this.repo.createGrade(dto),
      `Grade ${dto.code} already exists`,
    );
  }

  updateDefectType(code: string, dto: UpdateLookupDto): Promise<LookupView> {
    return this.guardMissing(
      () => this.repo.updateDefectType(code, dto),
      `Defect type ${code} not found`,
    );
  }

  updateGrade(code: string, dto: UpdateLookupDto): Promise<LookupView> {
    return this.guardMissing(
      () => this.repo.updateGrade(code, dto),
      `Grade ${code} not found`,
    );
  }

  private async guard<T>(run: () => Promise<T>, conflict: string): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(conflict);
      throw error;
    }
  }

  private async guardMissing<T>(
    run: () => Promise<T>,
    missing: string,
  ): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (isNotFound(error)) throw new NotFoundException(missing);
      throw error;
    }
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2025'
  );
}
