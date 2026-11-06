import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface UpdateCompanyData {
  name?: string;
  legalName?: string;
  logoFile?: string;
  address?: string;
  phone?: string;
  country?: string;
  timeZone?: string;
  defaultLanguage?: string;
  currencyCode?: string;
  currencySign?: string;
  currencySignPosition?: string;
  currencyDecimals?: number;
  themeCode?: string;
  sessionDuration?: string;
}

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile() {
    return this.prisma.companyProfile.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        name: 'Malika ERP',
        theme: { connect: { code: 'caldera' } },
        defaultLanguage: 'uz',
        timeZone: 'Asia/Tashkent',
        currencyCode: 'USD',
        currencySign: '$',
        currencySignPosition: 'before',
        currencyDecimals: 2,
        sessionDuration: '12h',
      },
      update: {},
      include: {
        theme: true,
      },
    });
  }

  async updateProfile(data: UpdateCompanyData) {
    const { themeCode, ...scalars } = data;
    const themeConnect = themeCode
      ? { theme: { connect: { code: themeCode } } }
      : {};

    return this.prisma.companyProfile.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        name: data.name ?? 'Malika ERP',
        legalName: data.legalName ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        country: data.country ?? 'UZ',
        timeZone: data.timeZone ?? 'Asia/Tashkent',
        defaultLanguage: data.defaultLanguage ?? 'uz',
        currencyCode: data.currencyCode ?? 'USD',
        currencySign: data.currencySign ?? '$',
        currencySignPosition: data.currencySignPosition ?? 'before',
        currencyDecimals: data.currencyDecimals ?? 2,
        theme: { connect: { code: themeCode ?? 'caldera' } },
        sessionDuration: data.sessionDuration ?? '12h',
      },
      update: {
        ...scalars,
        ...themeConnect,
      },
      include: {
        theme: true,
      },
    });
  }

  async listThemes() {
    return this.prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findTheme(code: string) {
    return this.prisma.theme.findUnique({
      where: { code },
    });
  }
}
