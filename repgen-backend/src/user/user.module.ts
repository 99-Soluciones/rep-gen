import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GetBankPermissionsUseCase } from './application';
import { LoggerModule } from '../common/logger';
@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // Tiempo de vida en segundos
      max: 100, // Número máximo de elementos en caché
    }),
    LoggerModule,
  ],
  providers: [GetBankPermissionsUseCase],
  exports: [GetBankPermissionsUseCase], // <-- Faltaba exportar el servicio
})
export class UserModule {}
