import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AccessModule } from '../access/access.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not defined');
        return {
          secret,
          signOptions: {
            algorithm: 'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
          },
        } as JwtModuleOptions;
      },
    }),
    AccessModule,
    StoresModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
