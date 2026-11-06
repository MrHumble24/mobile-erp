import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { CompanyService } from './company.service.js';

@Controller('manifest.webmanifest')
export class ManifestController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Public()
  @Header('Content-Type', 'application/manifest+json')
  @Header('Cache-Control', 'public, max-age=60')
  getManifest() {
    return this.companyService.getManifest();
  }
}
