import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SetPermissionsDto } from './dto/set-permissions.dto.js';
import { SetRolesDto } from './dto/set-roles.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@RequirePermissions('user.manage')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list({
      search: query.search,
      role: query.role,
      active: query.active === undefined ? undefined : query.active === 'true',
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('stats')
  stats() {
    return this.users.stats();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Get(':id/effective-permissions')
  effectivePermissions(@Param('id') id: string) {
    return this.users.getEffectivePermissions(id);
  }

  @Post()
  create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.users.create(caller, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(caller, id, dto);
  }

  @Post(':id/password')
  @HttpCode(204)
  resetPassword(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.users.resetPassword(caller, id, dto.password);
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
