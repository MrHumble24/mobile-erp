import {
  Injectable,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { SecretsService } from '../secrets/secrets.service.js';
import { CompanyService } from '../company/company.service.js';
import { AuthService } from '../auth/auth.service.js';
import { SetupDto, OwnerSetupDto, CompanySetupDto } from './dto/setup.dto.js';

@Injectable()
export class SetupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SetupService.name);
  private readonly dataDir = process.env.DATA_DIR?.trim() || './data';
  private failedAttempts: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly secrets: SecretsService,
    private readonly company: CompanyService,
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const userCount = await this.prisma.user.count();
    if (userCount === 0) {
      const code = this.getOrCreateSetupCode();
      this.logger.warn(
        `========================================================`,
      );
      this.logger.warn(`INITIAL SETUP REQUIRED`);
      this.logger.warn(`One-time setup code: ${code}`);
      this.logger.warn(`Open the web console to complete first-boot setup.`);
      this.logger.warn(
        `========================================================`,
      );
    }
  }

  getSetupCodePath(): string {
    mkdirSync(this.dataDir, { recursive: true });
    return join(this.dataDir, 'setup-code.txt');
  }

  getOrCreateSetupCode(): string {
    const filePath = this.getSetupCodePath();
    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, 'utf8').trim();
      if (existing) return existing;
    }
    const code = randomBytes(4).toString('hex').toUpperCase();
    writeFileSync(filePath, code, { mode: 0o600, encoding: 'utf8' });
    return code;
  }

  async getStatus(): Promise<{ needsSetup: boolean }> {
    const count = await this.prisma.user.count();
    return { needsSetup: count === 0 };
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    this.failedAttempts = this.failedAttempts.filter((t) => now - t < windowMs);
    if (this.failedAttempts.length >= 5) {
      throw new HttpException(
        'Too many invalid setup code attempts. Please wait 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async createOwnerInTx(
    tx: PrismaTx,
    owner: OwnerSetupDto,
    defaultLanguage?: string,
  ) {
    const passwordHash = await argon2.hash(owner.password);
    return tx.user.create({
      data: {
        email: owner.email.trim().toLowerCase(),
        passwordHash,
        profile: {
          create: {
            firstName: owner.firstName.trim(),
            lastName: owner.lastName?.trim(),
            phone: owner.phone?.trim(),
            locale: defaultLanguage || 'uz',
          },
        },
        roles: {
          create: { roleCode: 'ADMIN' },
        },
      },
    });
  }

  private async upsertCompanyInTx(tx: PrismaTx, company: CompanySetupDto) {
    return tx.companyProfile.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        name: company.name.trim(),
        legalName: company.legalName?.trim(),
        address: company.address?.trim(),
        phone: company.phone?.trim(),
        country: company.country || 'UZ',
        timeZone: company.timeZone || 'Asia/Tashkent',
        defaultLanguage: company.defaultLanguage || 'uz',
        currencyCode: company.currencyCode || 'USD',
        currencySign: company.currencySign || '$',
        currencySignPosition: company.currencySignPosition || 'before',
        currencyDecimals: company.currencyDecimals ?? 2,
        theme: { connect: { code: company.themeCode || 'caldera' } },
        sessionDuration: '12h',
      },
      update: {
        name: company.name.trim(),
        legalName: company.legalName?.trim(),
        address: company.address?.trim(),
        phone: company.phone?.trim(),
        country: company.country || 'UZ',
        timeZone: company.timeZone || 'Asia/Tashkent',
        defaultLanguage: company.defaultLanguage || 'uz',
        currencyCode: company.currencyCode || 'USD',
        currencySign: company.currencySign || '$',
        currencySignPosition: company.currencySignPosition || 'before',
        currencyDecimals: company.currencyDecimals ?? 2,
        ...(company.themeCode
          ? { theme: { connect: { code: company.themeCode } } }
          : {}),
      },
    });
  }

  private async provisionStoreInTx(
    tx: PrismaTx,
    dto: SetupDto,
    userId: string,
  ) {
    const storeName = dto.firstStore?.name?.trim() || dto.company.name.trim();
    const storeAddress =
      dto.firstStore?.address?.trim() || dto.company.address?.trim();
    const storePhone =
      dto.firstStore?.phone?.trim() || dto.company.phone?.trim();

    let store = await tx.store.findFirst({ orderBy: { createdAt: 'asc' } });
    if (store) {
      store = await tx.store.update({
        where: { id: store.id },
        data: { name: storeName, address: storeAddress, phone: storePhone },
      });
    } else {
      store = await tx.store.create({
        data: { name: storeName, address: storeAddress, phone: storePhone },
      });
    }

    await tx.userStore.upsert({
      where: { userId_storeId: { userId, storeId: store.id } },
      create: { userId, storeId: store.id },
      update: {},
    });

    await this.upsertStoreSettingsInTx(tx, store.id, dto);
    return store;
  }

  private async upsertStoreSettingsInTx(
    tx: PrismaTx,
    storeId: string,
    dto: SetupDto,
  ) {
    const sw = dto.switches || {};
    await tx.storeSettings.upsert({
      where: { storeId },
      create: {
        storeId,
        discountsEnabled: sw.discountsEnabled ?? false,
        customerCreditEnabled: sw.customerCreditEnabled ?? false,
        shiftsEnabled: sw.shiftsEnabled ?? false,
        repairsEnabled: sw.repairsEnabled ?? false,
        bonusEnabled: sw.bonusEnabled ?? false,
        receiptPrintingEnabled: sw.receiptPrintingEnabled ?? false,
        telegramChatId: dto.telegram?.chatId?.trim() || null,
      },
      update: {
        discountsEnabled: sw.discountsEnabled ?? false,
        customerCreditEnabled: sw.customerCreditEnabled ?? false,
        shiftsEnabled: sw.shiftsEnabled ?? false,
        repairsEnabled: sw.repairsEnabled ?? false,
        bonusEnabled: sw.bonusEnabled ?? false,
        receiptPrintingEnabled: sw.receiptPrintingEnabled ?? false,
        ...(dto.telegram?.chatId
          ? { telegramChatId: dto.telegram.chatId.trim() }
          : {}),
      },
    });
  }

  private cleanupSetupCode(): void {
    const filePath = this.getSetupCodePath();
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // Ignore unlink error
      }
    }
  }

  async setup(dto: SetupDto) {
    const existingCount = await this.prisma.user.count();
    if (existingCount > 0) {
      throw new ConflictException('Setup has already been completed');
    }

    this.checkRateLimit();

    const expectedCode = this.getOrCreateSetupCode();
    if (!dto.code || dto.code.trim().toUpperCase() !== expectedCode) {
      this.failedAttempts.push(Date.now());
      throw new BadRequestException('Invalid setup code');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(7429103)');
      if ((await tx.user.count()) > 0) {
        throw new ConflictException('Setup has already been completed');
      }

      const user = await this.createOwnerInTx(
        tx,
        dto.owner,
        dto.company.defaultLanguage,
      );
      await this.upsertCompanyInTx(tx, dto.company);
      const store = await this.provisionStoreInTx(tx, dto, user.id);
      return { user, store };
    });

    if (dto.telegram?.botToken?.trim()) {
      await this.secrets.set(
        'provider.telegram.bot_token',
        dto.telegram.botToken.trim(),
      );
    }

    this.cleanupSetupCode();

    const sessionDuration = await this.company.getSessionDuration();
    const accessToken = await this.jwt.signAsync(
      { sub: result.user.id, email: result.user.email },
      { expiresIn: sessionDuration as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );
    const userView = await this.auth.me(result.user.id);

    return { accessToken, user: userView };
  }
}
