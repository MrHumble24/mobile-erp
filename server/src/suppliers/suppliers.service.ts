import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { SuppliersRepository } from './suppliers.repository.js';
import { SupplierView } from './types/supplier.types.js';

@Injectable()
export class SuppliersService {
  constructor(private readonly repo: SuppliersRepository) {}

  list(): Promise<SupplierView[]> {
    return this.repo.findAll();
  }

  get(id: string): Promise<SupplierView> {
    return this.require(id);
  }

  create(dto: CreateSupplierDto): Promise<SupplierView> {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierView> {
    await this.require(id);
    return this.repo.update(id, dto);
  }

  private async require(id: string): Promise<SupplierView> {
    const supplier = await this.repo.findById(id);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }
}
