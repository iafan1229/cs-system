import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationRecordDto } from './dto/create-consultation-record.dto';
import { UpdateConsultationRecordDto } from './dto/update-consultation-record.dto';

@Injectable()
export class ConsultationRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reservationId: number,
    userId: number,
    createDto: CreateConsultationRecordDto,
  ) {
    // 예약 존재 및 소유자 확인
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        schedule: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation with ID ${reservationId} not found`,
      );
    }

    if (reservation.schedule.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // 이미 기록이 있는지 확인
    const existing = await this.prisma.consultationRecord.findUnique({
      where: { reservationId },
    });

    if (existing) {
      // 업데이트
      return this.prisma.consultationRecord.update({
        where: { reservationId },
        data: { content: createDto.content },
      });
    }

    // 생성
    return this.prisma.consultationRecord.create({
      data: {
        reservationId,
        content: createDto.content,
      },
    });
  }

  async findOne(reservationId: number, userId: number) {
    const record = await this.prisma.consultationRecord.findUnique({
      where: { reservationId },
      include: {
        reservation: {
          include: {
            schedule: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(
        `Consultation record for reservation ${reservationId} not found`,
      );
    }

    if (record.reservation.schedule.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return record;
  }

  async update(
    id: number,
    userId: number,
    updateDto: UpdateConsultationRecordDto,
  ) {
    const record = await this.prisma.consultationRecord.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            schedule: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Consultation record with ID ${id} not found`);
    }

    if (record.reservation.schedule.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.consultationRecord.update({
      where: { id },
      data: updateDto,
    });
  }
}
