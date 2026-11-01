import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { SetPermissionsDto } from './dto/set-permissions.dto.js';
import { SetRolesDto } from './dto/set-roles.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@RequirePermissions('user.manage')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Post()
  create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.users.create(caller, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Put(':id/roles')
  setRoles(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetRolesDto,
  ) {
    return this.users.setRoles(caller, id, dto);
  }

  @Put(':id/permissions')
  setPermissions(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.users.setPermissions(caller, id, dto);
  }
}
