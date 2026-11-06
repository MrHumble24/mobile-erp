import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CompanyService } from './company.service.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

interface UploadedLogo {
  buffer: Buffer;
}

@Controller()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('company')
  @RequirePermissions('settings.manage')
  getCompany() {
    return this.companyService.getProfile();
  }

  @Patch('company')
  @RequirePermissions('settings.manage')
  updateCompany(@Body() dto: UpdateCompanyDto) {
    return this.companyService.updateProfile(dto);
  }

  @Post('company/logo')
  @RequirePermissions('settings.manage')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadLogo(@UploadedFile() file?: UploadedLogo) {
    if (!file?.buffer) {
      throw new BadRequestException(
        'No image file was uploaded (field "file")',
      );
    }
    return this.companyService.saveLogo(file.buffer);
  }

  @Get('themes')
  @Public()
  listThemes() {
    return this.companyService.listThemes();
  }
}
