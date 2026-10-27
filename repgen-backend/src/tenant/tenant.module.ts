import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from '../common/logger/logger.module';
import { TenantController } from './presentation/tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // Tiempo de vida en milisegundos
      max: 100, // Número máximo de elementos en caché
    }),
    LoggerModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
