import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AccessTokensService } from '../access-tokens/access-tokens.service';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private accessTokensService: AccessTokensService,
  ) {}

  private validateTimeSlot(startTime: Date, endTime: Date): void {
    const duration = endTime.getTime() - startTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (duration !== thirtyMinutes) {
      throw new BadRequestException('Schedule must be exactly 30 minutes');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  private async checkTimeOverlap(
    userId: number,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: number,
  ): Promise<void> {
    const overlapping = await this.prisma.schedule.findFirst({
      where: {
        userId,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException('Time slot overlaps with existing schedule');
    }
  }

  async create(userId: number, createScheduleDto: CreateScheduleDto) {
    const startTime = new Date(createScheduleDto.startTime);
    const endTime = new Date(createScheduleDto.endTime);

    this.validateTimeSlot(startTime, endTime);
    await this.checkTimeOverlap(userId, startTime, endTime);

    return this.prisma.schedule.create({
      data: {
        userId,
        startTime,
        endTime,
        maxReservations: createScheduleDto.maxReservations || 3,
      },
      include: {
        reservations: {
          select: {
            id: true,
            applicantName: true,
            applicantEmail: true,
            status: true,
            createdAt: true,
          },
        },
      },
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

    return this.prisma.schedule.findMany({
      where,
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findOne(id: number, userId: number) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, userId },
      include: {
        reservations: {
          select: {
            id: true,
            applicantName: true,
            applicantEmail: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

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
    if (schedule._count.reservations > 0) {
      throw new BadRequestException(
        'Cannot update schedule with existing reservations',
      );
    }

    const startTime = updateScheduleDto.startTime
      ? new Date(updateScheduleDto.startTime)
      : schedule.startTime;
    const endTime = updateScheduleDto.endTime
      ? new Date(updateScheduleDto.endTime)
      : schedule.endTime;

    if (updateScheduleDto.startTime || updateScheduleDto.endTime) {
      this.validateTimeSlot(startTime, endTime);
      await this.checkTimeOverlap(userId, startTime, endTime, id);
    }

    return this.prisma.schedule.update({
      where: { id },
      data: {
        startTime: updateScheduleDto.startTime
          ? new Date(updateScheduleDto.startTime)
          : undefined,
        endTime: updateScheduleDto.endTime
          ? new Date(updateScheduleDto.endTime)
          : undefined,
        maxReservations: updateScheduleDto.maxReservations,
      },
    });
  }

  async remove(id: number, userId: number) {
    const schedule = await this.findOne(id, userId);

    // 예약이 있는 경우 삭제 제한
    if (schedule._count.reservations > 0) {
      throw new BadRequestException(
        'Cannot delete schedule with existing reservations',
      );
    }

    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  async generateLink(scheduleId: number, userId: number, email: string) {
    const schedule = await this.findOne(scheduleId, userId);
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
