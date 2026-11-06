import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { CompanyService } from './company.service.js';

@Controller('branding')
export class BrandingController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'public, max-age=60')
  getBranding() {
    return this.companyService.getBranding();
  }
}
