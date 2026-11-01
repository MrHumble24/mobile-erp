import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { AccessService } from './access.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto.js';

@Controller('access')
@RequirePermissions('role.manage')
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Get('roles')
  listRoles() {
    return this.access.listRoles();
  }

  @Get('permissions')
  listPermissions() {
    return this.access.listPermissions();
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.access.createRole(dto);
  }

  @Put('roles/:code/permissions')
  setRolePermissions(
    @Param('code') code: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    return this.access.setRolePermissions(code, dto.permissionCodes);
  }

  @Delete('roles/:code')
  @HttpCode(204)
  deleteRole(@Param('code') code: string) {
    return this.access.deleteRole(code);
  }
}
