import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ScheduleRepository } from './repositories/schedule.repository';
import { ScheduleDomainService } from './services/schedule-domain.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AccessTokensService } from '../access-tokens/access-tokens.service';

@Injectable()
export class SchedulesService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private scheduleDomainService: ScheduleDomainService,
    private accessTokensService: AccessTokensService,
  ) {}

  async create(userId: number, createScheduleDto: CreateScheduleDto) {
    const startTime = new Date(createScheduleDto.startTime);
    const endTime = new Date(createScheduleDto.endTime);

    // 비즈니스 로직 검증
    this.scheduleDomainService.validateTimeSlot(startTime, endTime);
    await this.scheduleDomainService.validateNoOverlap(
      userId,
      startTime,
      endTime,
    );

    // Repository를 통한 데이터 저장
    return this.scheduleRepository.create({
      ...createScheduleDto,
      userId,
    });
  }

  async findAll(userId: number, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    return this.scheduleRepository.findAll(where);
  }

  async findOne(id: number, userId: number) {
    const schedule = await this.scheduleRepository.findOne(id, { userId });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(
    id: number,
    userId: number,
    updateScheduleDto: UpdateScheduleDto,
  ) {
    const schedule = await this.findOne(id, userId);

    // 예약이 있는 경우 수정 제한
    const reservationCount = await this.scheduleRepository.count({
      scheduleId: id,
    });
    if (reservationCount > 0) {
      throw new BadRequestException(
        'Cannot update schedule with existing reservations',
      );
    }

    // 시간 변경 시 검증
    if (updateScheduleDto.startTime || updateScheduleDto.endTime) {
      const startTime = updateScheduleDto.startTime
        ? new Date(updateScheduleDto.startTime)
        : schedule.startTime;
      const endTime = updateScheduleDto.endTime
        ? new Date(updateScheduleDto.endTime)
        : schedule.endTime;

      this.scheduleDomainService.validateTimeSlot(startTime, endTime);
      await this.scheduleDomainService.validateNoOverlap(
        userId,
        startTime,
        endTime,
        id,
      );
    }

    return this.scheduleRepository.update(id, updateScheduleDto);
  }

  async remove(id: number, userId: number) {
    const schedule = await this.findOne(id, userId);

    // 예약이 있는 경우 삭제 제한
    const reservationCount = await this.scheduleRepository.count({
      scheduleId: id,
    });
    if (reservationCount > 0) {
      throw new BadRequestException(
        'Cannot delete schedule with existing reservations',
      );
    }

    return this.scheduleRepository.delete(id);
  }

  async generateLink(scheduleId: number, userId: number, email: string) {
    await this.findOne(scheduleId, userId);
    return this.accessTokensService.generateToken(scheduleId, email);
  }

  async generateLinkBatch(
    scheduleIds: number[],
    userId: number,
    email: string,
  ) {
    // 모든 스케줄이 현재 사용자의 것인지 확인
    for (const scheduleId of scheduleIds) {
      await this.findOne(scheduleId, userId);
    }
    return this.accessTokensService.generateTokensForSchedules(
      scheduleIds,
      email,
    );
  }
}

