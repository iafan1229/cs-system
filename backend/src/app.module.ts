import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AccessTokensModule } from './access-tokens/access-tokens.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ConsultationRecordsModule } from './consultation-records/consultation-records.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule, UsersModule, SchedulesModule, AccessTokensModule, ReservationsModule, ConsultationRecordsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
