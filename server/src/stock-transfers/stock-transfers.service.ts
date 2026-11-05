import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockRepository } from '../stock/stock.repository.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto.js';
import { ListStockTransfersQueryDto } from './dto/list-stock-transfers-query.dto.js';
import {
  executeCancelTransfer,
  executeCreateTransfer,
  executeReceiveTransfer,
} from './lib/transfer-execution.js';
import { validateTransferLines } from './lib/transfer-validation.js';
import { StockTransfersRepository } from './stock-transfers.repository.js';
import type { StockTransferView } from './types/stock-transfer.types.js';

@Injectable()
export class StockTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: StockTransfersRepository,
    private readonly stores: StoresService,
    private readonly stockRepo: StockRepository,
  ) {}

  async list(
    query: ListStockTransfersQueryDto,
  ): Promise<{ items: StockTransferView[]; total: number }> {
    const storeIds = await this.stores.currentStoreIds();
    return this.repo.list(storeIds, query);
  }

  async get(id: string): Promise<StockTransferView> {
    const transfer = await this.repo.findById(id);
    if (!transfer)
      throw new NotFoundException(`Stock transfer ${id} not found`);
    return transfer;
  }

  async create(
    caller: AuthenticatedUser,
    dto: CreateStockTransferDto,
  ): Promise<StockTransferView> {
    const sourceStoreId = await this.stores.currentStoreId();
    if (dto.targetStoreId === sourceStoreId) {
      throw new BadRequestException({
        code: 'CANNOT_TRANSFER_TO_SELF',
        message: 'Cannot transfer stock to the same store',
      });
    }

    const targetStore = await this.stores.get(dto.targetStoreId);
    if (targetStore.deactivatedAt) {
      throw new BadRequestException({
        code: 'STORE_DEACTIVATED',
        message: 'Cannot transfer stock to a deactivated store',
      });
    }

    const { unitLines, quantityLines } = await validateTransferLines(
      this.prisma,
      this.stockRepo,
      sourceStoreId,
      dto.lines,
    );

    const transferId = await this.prisma.$transaction((tx) =>
      executeCreateTransfer(tx, {
        sourceStoreId,
        targetStoreId: dto.targetStoreId,
        targetStoreName: targetStore.name,
        callerId: caller.id,
        note: dto.note,
        unitLines,
        quantityLines,
      }),
    );

    return (await this.repo.findById(transferId))!;
  }

  async receive(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<StockTransferView> {
    const transfer = await this.repo.findById(id);
    if (!transfer)
      throw new NotFoundException(`Stock transfer ${id} not found`);

    if (transfer.status !== 'SENT') {
      throw new BadRequestException({
        code: 'TRANSFER_NOT_SENT',
        message: `Transfer ${id} is ${transfer.status}, cannot receive`,
      });
    }

    const currentStoreId = await this.stores.currentStoreId();
    if (currentStoreId !== transfer.targetStoreId) {
      throw new BadRequestException({
        code: 'RECEIVE_WRONG_STORE',
        message: 'Must switch to destination store to receive transfer',
      });
    }

    await this.prisma.$transaction((tx) =>
      executeReceiveTransfer(tx, transfer, caller.id),
    );

    return (await this.repo.findById(id))!;
  }

  async cancel(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<StockTransferView> {
    const transfer = await this.repo.findById(id);
    if (!transfer)
      throw new NotFoundException(`Stock transfer ${id} not found`);

    if (transfer.status !== 'SENT') {
      throw new BadRequestException({
        code: 'TRANSFER_NOT_SENT',
        message: `Transfer ${id} is ${transfer.status}, cannot cancel`,
      });
    }

    const allowed = await this.stores.allowedStoreIds(caller);
    if (!allowed.includes(transfer.sourceStoreId)) {
      throw new ForbiddenException({
        code: 'STORE_FORBIDDEN',
        message: 'Cannot cancel transfer from a store you do not belong to',
      });
    }

    await this.prisma.$transaction((tx) =>
      executeCancelTransfer(tx, transfer, caller.id),
    );

    return (await this.repo.findById(id))!;
  }
}
