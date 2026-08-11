import { Global, Module } from '@nestjs/common';
import { FileMakerService } from './filemaker.service';
import { LoggerModule } from '../common/logger';
@Global() // @Global hace que FileMakerService esté disponible en toda la app sin tener que importarlo en cada módulo
@Module({
  imports: [LoggerModule],
  providers: [FileMakerService],
  exports: [FileMakerService],
})
export class FileMakerModule {}
