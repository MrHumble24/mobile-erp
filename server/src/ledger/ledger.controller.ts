import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { LedgerQueryDto } from './dto/ledger-query.dto.js';
import { TransferDto } from './dto/transfer.dto.js';
import { LedgerService } from './ledger.service.js';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get('accounts')
  accounts() {
    // No permission: cashiers pick cash/card at checkout without balance.read.
    return this.ledger.listAccounts();
  }

  @Get('balances')
  @RequirePermissions('balance.read')
  balances() {
    return this.ledger.getBalances();
  }

  @Get('transactions')
  @RequirePermissions('balance.read')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: LedgerQueryDto) {
    return this.ledger.list(query, user.permissions.has('device.cost.view'));
  }

  @Post('transactions')
  @RequirePermissions('balance.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLedgerEntryDto,
  ) {
    return this.ledger.createEntry(user.id, dto);
  }

  @Post('transfers')
  @RequirePermissions('balance.manage')
  transfer(@CurrentUser() user: AuthenticatedUser, @Body() dto: TransferDto) {
    return this.ledger.transfer(user.id, dto);
  }
}
