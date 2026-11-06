import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { OauthService } from './oauth.service.js';

/** OAuth connect flow for Drive / OneDrive. `start` and `redirect-uri` are
 * authenticated; `callback` is public (a browser redirect cannot carry a bearer
 * token) and protected by the single-use `state`. */
@Controller('backups/oauth')
export class OauthController {
  constructor(private readonly oauth: OauthService) {}

  @Get(':code/redirect-uri')
  @RequirePermissions('backup.read')
  redirectUri(@Param('code') code: string): { redirectUri: string } {
    return { redirectUri: this.oauth.redirectUri(code) };
  }

  @Get(':code/start')
  @RequirePermissions('backup.manage')
  start(
    @Param('code') code: string,
    @Query('returnTo') returnTo: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    return this.oauth.start(code, user.id, returnTo ?? '');
  }

  @Get(':code/callback')
  @Public()
  async callback(
    @Param('code') code: string,
    @Query('state') state: string,
    @Query('code') authCode: string,
    @Res() res: Response,
  ): Promise<void> {
    const to = await this.oauth.callback(code, state ?? '', authCode ?? '');
    res.redirect(302, to);
  }
}
