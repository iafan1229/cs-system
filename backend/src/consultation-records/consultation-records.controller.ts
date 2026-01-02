import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ConsultationRecordsService } from './consultation-records.service';
import { CreateConsultationRecordDto } from './dto/create-consultation-record.dto';
import { UpdateConsultationRecordDto } from './dto/update-consultation-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class ConsultationRecordsController {
  constructor(
    private readonly consultationRecordsService: ConsultationRecordsService,
  ) {}

  @Post('reservations/:id/consultation-record')
  create(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) reservationId: number,
    @Body() createDto: CreateConsultationRecordDto,
  ) {
    return this.consultationRecordsService.create(
      reservationId,
      req.user.id,
      createDto,
    );
  }

  @Get('reservations/:id/consultation-record')
  findOne(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) reservationId: number,
  ) {
    return this.consultationRecordsService.findOne(
      reservationId,
      req.user.id,
    );
  }

  @Patch('consultation-records/:id')
  update(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConsultationRecordDto,
  ) {
    return this.consultationRecordsService.update(id, req.user.id, updateDto);
  }
}
