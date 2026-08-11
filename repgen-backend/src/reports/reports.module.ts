import { Module } from '@nestjs/common';
import { ReportsController } from './presentation';
import {
  GetBankReportUseCase,
  GetSalesitemReportUseCase,
  GetSalesReportUseCase,
} from './application';
import { CacheModule } from '@nestjs/cache-manager';
import { UserModule } from '../user/user.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // Tiempo de vida en segundos
      max: 100, // Número máximo de elementos en caché
    }),
    UserModule,
    LoggerModule,
  ],
  controllers: [ReportsController],
  providers: [
    GetBankReportUseCase,
    GetSalesReportUseCase,
    GetSalesitemReportUseCase,
  ],
})
export class ReportsModule {}
