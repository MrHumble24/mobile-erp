import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ChangesQueryDto } from './dto/changes.query.dto.js';
import { PushDto } from './dto/push.dto.js';
import { ResolveConflictDto } from './dto/resolve-conflict.dto.js';
import { SyncChangesService } from './sync-changes.service.js';
import { SyncConflictsService } from './sync-conflicts.service.js';
import { SyncService } from './sync.service.js';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly sync: SyncService,
    private readonly conflicts: SyncConflictsService,
    private readonly changes: SyncChangesService,
  ) {}

  /** Any authenticated terminal may push; each mutation is permission-checked. */
  @Post('push')
  push(@CurrentUser() user: AuthenticatedUser, @Body() dto: PushDto) {
    return this.sync.push(user, dto);
  }

  @Get('conflicts')
  @RequirePermissions('sync.resolve')
  listConflicts() {
    return this.conflicts.listPending();
  }

  @Post('conflicts/:id/resolve')
  @RequirePermissions('sync.resolve')
  resolveConflict(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.conflicts.resolve(user, id, dto);
  }

  @Get('changes')
  @RequirePermissions('device.read')
  getChanges(@Query() query: ChangesQueryDto) {
    return this.changes.changes(query);
  }
}
