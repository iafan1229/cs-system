import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Reservation, Prisma } from '@prisma/client';
import { CreateReservationDto } from '../dto/create-reservation.dto';

@Injectable()
export class ReservationRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateReservationDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Reservation> {
    const client = tx || this.prisma;
    return client.reservation.create({
      data: {
        scheduleId: data.scheduleId,
        applicantName: data.applicantName,
        applicantEmail: data.applicantEmail,
        status: 'confirmed',
      },
      include: {
        schedule: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });
  }

  async count(
    scheduleId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    return client.reservation.count({
      where: { scheduleId },
    });
  }

  async findBySchedule(scheduleId: number): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { scheduleId },
      include: {
        consultationRecord: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findById(id: number): Promise<
    | (Reservation & {
        schedule: { id: number; userId: number } | null;
        consultationRecord: any;
      })
    | null
  > {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        schedule: {
          select: {
            id: true,
            userId: true,
          },
        },
        consultationRecord: true,
      },
    });
  }
}

