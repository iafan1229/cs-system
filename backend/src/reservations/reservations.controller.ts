import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Public API: 예약 가능한 스케줄 조회
  @Get('public/schedules')
  getAvailableSchedules(@Query('token') token: string) {
    return this.reservationsService.getAvailableSchedules(token);
  }

  // Public API: 예약 신청
  @Post('public/reservations')
  createPublic(
    @Query('token') token: string,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    return this.reservationsService.createPublic(token, createReservationDto);
  }

  // Admin API: 스케줄별 예약 목록
  @Get('admin/schedules/:scheduleId/reservations')
  @UseGuards(JwtAuthGuard)
  findAllBySchedule(
    @Request() req: RequestWithUser,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.reservationsService.findAllBySchedule(scheduleId, req.user.id);
  }

  // Admin API: 예약 상세 조회
  @Get('admin/reservations/:id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.findOne(id, req.user.id);
  }
}
