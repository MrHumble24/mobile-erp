import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { SecretsService } from '../secrets/secrets.service.js';
import {
  RefundPaymentDto,
  SetProviderSecretDto,
  UpdateProviderConfigDto,
} from './dto/update-provider-config.dto.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import { OnlinePaymentsService } from './online-payments.service.js';
import { ProviderRegistry } from './providers/provider.registry.js';
import type { CallbackRequest } from './types/online-payment.types.js';

function notAllowedResponse(providerCode: string, id?: unknown) {
  if (providerCode === 'PAYME') {
    return {
      statusCode: 200,
      body: {
        jsonrpc: '2.0',
        id: id ?? null,
        error: {
          code: -32504,
          message: {
            ru: 'Провайдер отключен или доступ запрещен',
            uz: 'Provayder o‘chirilgan yoki kirish taqiqlangan',
            en: 'Provider disabled or access denied',
          },
        },
      },
    };
  }
  return {
    statusCode: 200,
    body: { error: -1, error_note: 'Provider disabled or access denied' },
  };
}

@Controller('online-payments')
export class OnlinePaymentsController {
  constructor(
    private readonly payments: OnlinePaymentsService,
    private readonly repo: OnlinePaymentsRepository,
    private readonly registry: ProviderRegistry,
    private readonly secrets: SecretsService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Post('callback/:provider')
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Param('provider') providerParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const code = providerParam.toUpperCase();
    const reqId = (req.body as { id?: unknown })?.id ?? null;

    if (!this.registry.has(code)) {
      const resp = notAllowedResponse(code, reqId);
      res.status(resp.statusCode).json(resp.body);
      return;
    }

    const config = await this.repo.getConfig(code);
    if (!config || !config.isEnabled) {
      const resp = notAllowedResponse(code, reqId);
      res.status(resp.statusCode).json(resp.body);
      return;
    }

    const clientIp = (req.ip ?? req.socket.remoteAddress ?? '').replace(
      /^::ffff:/,
      '',
    );
    const allowed = config.allowedIps as string[] | null;
    if (allowed && Array.isArray(allowed) && allowed.length > 0) {
      if (!allowed.includes(clientIp)) {
        const resp = notAllowedResponse(code, reqId);
        res.status(resp.statusCode).json(resp.body);
        return;
      }
    }

    const adapter = this.registry.get(code);
    const secret = await this.secrets.read(`payment.${code.toLowerCase()}.key`);

    const callbackReq: CallbackRequest = {
      headers: req.headers,
      body: req.body,
      ip: clientIp,
    };

    const out = await adapter.handleCallback(
      callbackReq,
      {
        ...(config.settings as Record<string, unknown>),
        isTestMode: config.isTestMode,
      },
      secret,
      this.payments,
    );

    if (out.headers) {
      for (const [k, v] of Object.entries(out.headers)) {
        res.setHeader(k, v);
      }
    }
    res.status(out.statusCode).json(out.body);
  }

  @RequirePermissions('settings.manage')
  @Get('providers')
  listProviders() {
    return this.payments.listConfigs();
  }

  @RequirePermissions('settings.manage')
  @Get('providers/:code')
  getProvider(@Param('code') code: string) {
    return this.payments.getConfig(code);
  }

  @RequirePermissions('settings.manage')
  @Put('providers/:code')
  updateProvider(
    @Param('code') code: string,
    @Body() dto: UpdateProviderConfigDto,
  ) {
    return this.payments.saveConfig(code, dto);
  }

  @RequirePermissions('settings.manage')
  @Post('providers/:code/secret')
  @HttpCode(HttpStatus.OK)
  async setSecret(
    @Param('code') code: string,
    @Body() dto: SetProviderSecretDto,
  ) {
    await this.payments.setSecret(code, dto.secret);
    return { ok: true };
  }

  @RequirePermissions('settings.manage')
  @Post('providers/:code/check')
  @HttpCode(HttpStatus.OK)
  checkProvider(@Param('code') code: string) {
    return this.payments.checkProvider(code);
  }

  @RequirePermissions('payment.refund')
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.payments.refundPayment(id, dto.reason);
  }
}
