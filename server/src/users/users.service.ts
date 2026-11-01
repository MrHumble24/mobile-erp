import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AccessService } from '../access/access.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { SetPermissionsDto } from './dto/set-permissions.dto.js';
import { SetRolesDto } from './dto/set-roles.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersRepository } from './users.repository.js';
import { UserView } from './types/user.types.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly access: AccessService,
  ) {}

  list(): Promise<UserView[]> {
    return this.repo.findAll();
  }

  async get(id: string): Promise<UserView> {
    return this.require(id);
  }

  async create(dto: CreateUserDto): Promise<UserView> {
    await this.assertRolesExist(dto.roleCodes);
    const passwordHash = await argon2.hash(dto.password);
    return this.repo.create({
      email: dto.email,
      passwordHash,
      profile: dto.profile,
      roleCodes: dto.roleCodes,
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserView> {
    await this.require(id);
    return this.repo.update(id, dto);
  }

  async setRoles(id: string, dto: SetRolesDto): Promise<UserView> {
    await this.require(id);
    await this.assertRolesExist(dto.roleCodes);
    return this.repo.setRoles(id, dto.roleCodes);
  }

  async setPermissions(id: string, dto: SetPermissionsDto): Promise<UserView> {
    await this.require(id);
    await this.assertPermissionsExist(
      dto.overrides.map((o) => o.permissionCode),
    );
    await this.repo.setPermissions(id, dto.overrides);
    return this.require(id);
  }

  private async require(id: string): Promise<UserView> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  private async assertRolesExist(codes: string[]): Promise<void> {
    const known = new Set((await this.access.listRoles()).map((r) => r.code));
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown roles: ${unknown.join(', ')}`);
    }
  }

  private async assertPermissionsExist(codes: string[]): Promise<void> {
    const known = new Set(
      (await this.access.listPermissions()).map((p) => p.code),
    );
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown permissions: ${unknown.join(', ')}`,
      );
    }
  }
}
