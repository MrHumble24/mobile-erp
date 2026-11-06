import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { CompanyService } from './company.service.js';

@Controller('branding')
export class BrandingController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Public()
  // no-cache = ask every time (cheap, the ETag answers 304). A max-age kept the
  // old name, theme and language on screen for a minute after setup or a change.
  @Header('Cache-Control', 'no-cache')
  getBranding() {
    return this.companyService.getBranding();
  }
}
