import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { CustomerView } from './types/customer.types.js';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  search(query?: string): Promise<CustomerView[]> {
    return this.repo.search(query);
  }

  get(id: string): Promise<CustomerView> {
    return this.require(id);
  }

  create(dto: CreateCustomerDto): Promise<CustomerView> {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerView> {
    await this.require(id);
    return this.repo.update(id, dto);
  }

  private async require(id: string): Promise<CustomerView> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }
}
