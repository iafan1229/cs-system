import { Module } from '@nestjs/common';
import { ConsultationRecordsService } from './consultation-records.service';
import { ConsultationRecordsController } from './consultation-records.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsultationRecordsController],
  providers: [ConsultationRecordsService],
  exports: [ConsultationRecordsService],
})
export class ConsultationRecordsModule {}
