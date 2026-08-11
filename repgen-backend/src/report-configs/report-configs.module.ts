import { Module } from '@nestjs/common';
import { LoggerModule } from '../common/logger/logger.module';
import { ReportConfigsController } from './presentation/report-configs.controller';
import { GetReportConfigsUseCase } from './application/get-report-configs.use-case';
import { CreateReportConfigUseCase } from './application/create-report-config.use-case';
import { UpdateReportConfigUseCase } from './application/update-report-config.use-case';
import { DeleteReportConfigUseCase } from './application/delete-report-config.use-case';

@Module({
  imports: [LoggerModule],
  controllers: [ReportConfigsController],
  providers: [
    GetReportConfigsUseCase,
    CreateReportConfigUseCase,
    UpdateReportConfigUseCase,
    DeleteReportConfigUseCase,
  ],
})
export class ReportConfigsModule {}
