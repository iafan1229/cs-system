import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokensService } from '../access-tokens/access-tokens.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private accessTokensService: AccessTokensService,
  ) {}

  async createPublic(
    token: string,
    createReservationDto: CreateReservationDto,
  ) {
    // AccessToken 검증
    const accessToken = await this.accessTokensService.validateToken(token);
    if (!accessToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    // 스케줄 ID가 토큰에 연결된 스케줄 중 하나인지 확인
    const scheduleIds = accessToken.schedules.map((ats) => ats.schedule.id);
    if (!scheduleIds.includes(createReservationDto.scheduleId)) {
      throw new BadRequestException('Schedule ID does not match token');
    }

    // 동시성 제어: Pessimistic Lock 사용
    return this.prisma.$transaction(async (tx) => {
      // SELECT FOR UPDATE로 Schedule을 Lock
      interface ScheduleRow {
        id: number;
        userId: number;
        startTime: Date;
        endTime: Date;
        maxReservations: number;
        createdAt: Date;
        updatedAt: Date;
      }

      const schedule = await tx.$queryRaw<ScheduleRow[]>`
        SELECT * FROM schedules 
        WHERE id = ${createReservationDto.scheduleId} 
        FOR UPDATE
      `;

      if (!schedule || schedule.length === 0) {
        throw new NotFoundException(
          `Schedule with ID ${createReservationDto.scheduleId} not found`,
        );
      }

      const scheduleData = schedule[0];

      // 현재 예약 수 확인
      const currentReservations = await tx.reservation.count({
        where: { scheduleId: createReservationDto.scheduleId },
      });

      // 정원 초과 검증
      if (currentReservations >= scheduleData.maxReservations) {
        throw new ConflictException('Schedule is fully booked');
      }

      // 예약 생성
      const reservation = await tx.reservation.create({
        data: {
          scheduleId: createReservationDto.scheduleId,
          applicantName: createReservationDto.applicantName,
          applicantEmail: createReservationDto.applicantEmail,
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

      return reservation;
    });
  }

  async getAvailableSchedules(token: string) {
    // AccessToken 검증
    const accessToken = await this.accessTokensService.validateToken(token);
    if (!accessToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    // 토큰에 연결된 모든 스케줄 ID 가져오기
    const scheduleIds = accessToken.schedules.map((ats) => ats.schedule.id);

    if (scheduleIds.length === 0) {
      throw new BadRequestException('No schedules found for this token');
    }

    // 예약 가능한 스케줄 조회 (현재 예약 수 < 최대 정원)
    const schedules = await this.prisma.schedule.findMany({
      where: {
        id: { in: scheduleIds },
      },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    // 예약 가능한 슬롯만 필터링
    const availableSchedules = schedules.filter(
      (schedule) => schedule._count.reservations < schedule.maxReservations,
    );

    // 날짜별 그룹화
    const groupedByDate = availableSchedules.reduce(
      (acc, schedule) => {
        const date = new Date(schedule.startTime).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: schedule.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          maxReservations: schedule.maxReservations,
          currentReservations: schedule._count.reservations,
          availableSlots:
            schedule.maxReservations - schedule._count.reservations,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return {
      schedules: groupedByDate,
      recipientEmail: accessToken.recipientEmail, // 상담희망자 이메일 반환
    };
  }

  async findAllBySchedule(scheduleId: number, userId: number) {
    // 스케줄 소유자 확인
    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

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

  async findOne(id: number, userId: number) {
    const reservation = await this.prisma.reservation.findUnique({
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

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservation.schedule.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return reservation;
  }
}
