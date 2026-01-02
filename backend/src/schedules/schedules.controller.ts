import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createScheduleDto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(req.user.id, createScheduleDto);
  }

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.schedulesService.findAll(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  findOne(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.schedulesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, req.user.id, updateScheduleDto);
  }

  @Delete(':id')
  remove(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.schedulesService.remove(id, req.user.id);
  }

  @Post(':id/generate-link')
  async generateLink(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('email') email?: string,
  ) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('상담희망자 이메일은 필수입니다.');
    }
    return this.schedulesService.generateLink(
      id,
      req.user.id,
      email,
    );
  }

  @Post('generate-link-batch')
  async generateLinkBatch(
    @Request() req: RequestWithUser,
    @Body('scheduleIds') scheduleIds: number[],
    @Body('email') email?: string,
  ) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('상담희망자 이메일은 필수입니다.');
    }
    if (!scheduleIds || scheduleIds.length === 0) {
      throw new BadRequestException('최소 하나의 스케줄을 선택해야 합니다.');
    }
    return this.schedulesService.generateLinkBatch(
      scheduleIds,
      req.user.id,
      email,
    );
  }
}
