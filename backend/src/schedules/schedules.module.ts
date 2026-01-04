import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { ScheduleRepository } from './repositories/schedule.repository';
import { ScheduleDomainService } from './services/schedule-domain.service';
import { ReservationsModule } from '../reservations/reservations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessTokensModule } from '../access-tokens/access-tokens.module';

@Module({
  imports: [PrismaModule, AccessTokensModule, ReservationsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleRepository, ScheduleDomainService],
  exports: [SchedulesService, ScheduleRepository],
})
export class SchedulesModule {}
