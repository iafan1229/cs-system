import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationRepository } from './repositories/reservation.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessTokensModule } from '../access-tokens/access-tokens.module';

@Module({
  imports: [PrismaModule, AccessTokensModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationRepository],
  exports: [ReservationsService, ReservationRepository],
})
export class ReservationsModule {}
