import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Schedule, Prisma } from '@prisma/client';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { IRepository } from '../../common/interfaces/repository.interface';

@Injectable()
export class ScheduleRepository
  implements IRepository<Schedule, CreateScheduleDto, UpdateScheduleDto>
{
  constructor(private prisma: PrismaService) {}

  async findAll(where?: Prisma.ScheduleWhereInput): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where,
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });
  }

  async findOne(
    id: number,
    where?: Prisma.ScheduleWhereInput,
  ): Promise<Schedule | null> {
    return this.prisma.schedule.findFirst({
      where: { id, ...where },
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

  async create(data: CreateScheduleDto & { userId: number }): Promise<Schedule> {
    return this.prisma.schedule.create({
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        maxReservations: data.maxReservations || 3,
        userId: data.userId,
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

  async update(id: number, data: UpdateScheduleDto): Promise<Schedule> {
    const updateData: Prisma.ScheduleUpdateInput = {};
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.maxReservations !== undefined)
      updateData.maxReservations = data.maxReservations;

    return this.prisma.schedule.update({
      where: { id },
      data: updateData,
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

  async delete(id: number): Promise<void> {
    await this.prisma.schedule.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.ScheduleWhereInput): Promise<number> {
    return this.prisma.schedule.count({ where });
  }

  async findOverlapping(
    userId: number,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: number,
  ): Promise<Schedule | null> {
    return this.prisma.schedule.findFirst({
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
  }
}

