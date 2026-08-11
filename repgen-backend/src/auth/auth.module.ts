import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from '../common/logger';

/**
 * Módulo de autenticación que configura el sistema de autenticación JWT para la aplicación.
 * Este módulo registra el servicio de autenticación, el controlador de autenticación y el guardia JWT,
 * y lo establece como un guardia global para proteger las rutas por defecto, permitiendo excepciones para las rutas
 * marcadas como públicas.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET', 'default_secret'),
        signOptions: {
          expiresIn: parseInt(
            configService.get<string>('JWT_EXPIRES_IN', '3600'),
            10,
          ),
        },
      }),
    }),
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}
