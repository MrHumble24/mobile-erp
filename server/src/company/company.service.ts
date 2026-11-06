import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CompanyRepository } from './company.repository.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { detectLogoMime } from './lib/logo-file.js';

@Injectable()
export class CompanyService {
  private readonly uploadsDir = process.env.UPLOADS_DIR?.trim() || './uploads';

  constructor(private readonly repo: CompanyRepository) {}

  async getBranding() {
    const [hasUsers, profile] = await Promise.all([
      this.repo.hasUsers(),
      this.repo.getProfile(),
    ]);
    return {
      name: hasUsers ? profile.name : null,
      logoUrl: profile.logoFile ? `/uploads/${profile.logoFile}` : null,
      themeCode: profile.themeCode,
      defaultLanguage: profile.defaultLanguage,
      currency: {
        code: profile.currencyCode,
        sign: profile.currencySign,
        signPosition: profile.currencySignPosition,
        decimals: profile.currencyDecimals,
      },
    };
  }

  async getProfile() {
    const [profile, themes] = await Promise.all([
      this.repo.getProfile(),
      this.repo.listThemes(),
    ]);

    return {
      ...profile,
      logoUrl: profile.logoFile ? `/uploads/${profile.logoFile}` : null,
      themes,
    };
  }

  async listThemes() {
    return this.repo.listThemes();
  }

  async updateProfile(dto: UpdateCompanyDto) {
    if (dto.themeCode) {
      const theme = await this.repo.findTheme(dto.themeCode);
      if (!theme) {
        throw new BadRequestException(`Unknown theme code: ${dto.themeCode}`);
      }
    }

    const updated = await this.repo.updateProfile(dto);
    return {
      ...updated,
      logoUrl: updated.logoFile ? `/uploads/${updated.logoFile}` : null,
    };
  }

  async saveLogo(buffer: Buffer): Promise<{ logoUrl: string }> {
    const mime = detectLogoMime(buffer);
    const ext =
      mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

    mkdirSync(this.uploadsDir, { recursive: true });

    const filename = `logo-${randomUUID()}.${ext}`;
    const filePath = join(this.uploadsDir, filename);

    writeFileSync(filePath, buffer);

    const profile = await this.repo.getProfile();
    if (profile.logoFile) {
      const oldPath = join(this.uploadsDir, profile.logoFile);
      if (existsSync(oldPath)) {
        try {
          unlinkSync(oldPath);
        } catch {
          // Ignore unlink errors
        }
      }
    }

    await this.repo.updateProfile({ logoFile: filename });
    return { logoUrl: `/uploads/${filename}` };
  }

  async getSessionDuration(): Promise<string> {
    const profile = await this.repo.getProfile();
    return profile.sessionDuration || process.env.JWT_EXPIRES_IN || '12h';
  }

  async getTimeZone(): Promise<string> {
    const profile = await this.repo.getProfile();
    return profile.timeZone || 'Asia/Tashkent';
  }

  async getCurrency() {
    const profile = await this.repo.getProfile();
    return {
      code: profile.currencyCode,
      sign: profile.currencySign,
      signPosition: profile.currencySignPosition,
      decimals: profile.currencyDecimals,
    };
  }

  async getManifest() {
    const profile = await this.repo.getProfile();
    const name = profile.name || 'ERP';
    return {
      name,
      short_name: name,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      icons: profile.logoFile
        ? [
            {
              src: `/uploads/${profile.logoFile}`,
              sizes: '192x192 512x512',
              type: 'image/png',
            },
          ]
        : [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
    };
  }
}
