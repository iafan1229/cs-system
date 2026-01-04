import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokensService } from '../access-tokens/access-tokens.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    schedule: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockAccessTokensService = {
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AccessTokensService,
          useValue: mockAccessTokensService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPublic', () => {
    const validToken = 'valid-token';
    const scheduleId = 1;
    const createReservationDto: CreateReservationDto = {
      scheduleId,
      applicantName: '홍길동',
      applicantEmail: 'test@example.com',
    };

    const mockAccessToken = {
      id: 1,
      token: validToken,
      recipientEmail: 'applicant@example.com',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      used: false,
      schedules: [
        {
          id: 1,
          schedule: {
            id: scheduleId,
            userId: 1,
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T10:30:00Z'),
            maxReservations: 3,
          },
        },
      ],
    };

    const mockSchedule = {
      id: scheduleId,
      userId: 1,
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T10:30:00Z'),
      maxReservations: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a reservation successfully', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(mockAccessToken);

      const mockTransaction = jest.fn((callback: (tx: any) => Promise<any>) => {
        const mockTx = {
          $queryRaw: jest.fn().mockResolvedValue([mockSchedule]),
          reservation: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 1,
              ...createReservationDto,
              status: 'confirmed',
              schedule: {
                id: scheduleId,
                startTime: mockSchedule.startTime,
                endTime: mockSchedule.endTime,
              },
            }),
          },
        };
        return Promise.resolve(callback(mockTx));
      });

      mockPrismaService.$transaction = mockTransaction;

      const result = await service.createPublic(
        validToken,
        createReservationDto,
      );

      expect(mockAccessTokensService.validateToken).toHaveBeenCalledWith(
        validToken,
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('applicantName', '홍길동');
      expect(result).toHaveProperty('applicantEmail', 'test@example.com');
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(null);

      await expect(
        service.createPublic('invalid-token', createReservationDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when schedule ID does not match token', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(mockAccessToken);

      const invalidDto: CreateReservationDto = {
        ...createReservationDto,
        scheduleId: 999, // 다른 스케줄 ID
      };

      await expect(
        service.createPublic(validToken, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when schedule is fully booked', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(mockAccessToken);

      const mockTransaction = jest.fn((callback: (tx: any) => Promise<any>) => {
        const mockTx = {
          $queryRaw: jest.fn().mockResolvedValue([mockSchedule]),
          reservation: {
            count: jest.fn().mockResolvedValue(3), // 정원 초과
            create: jest.fn(),
          },
        };
        return Promise.resolve(callback(mockTx));
      });

      mockPrismaService.$transaction = mockTransaction;

      await expect(
        service.createPublic(validToken, createReservationDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when schedule does not exist', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(mockAccessToken);

      const mockTransaction = jest.fn((callback: (tx: any) => Promise<any>) => {
        const mockTx = {
          $queryRaw: jest.fn().mockResolvedValue([]), // 스케줄 없음
          reservation: {
            count: jest.fn(),
            create: jest.fn(),
          },
        };
        return Promise.resolve(callback(mockTx));
      });

      mockPrismaService.$transaction = mockTransaction;

      await expect(
        service.createPublic(validToken, createReservationDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableSchedules', () => {
    const validToken = 'valid-token';
    const mockAccessToken = {
      id: 1,
      token: validToken,
      recipientEmail: 'applicant@example.com',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      used: false,
      schedules: [
        {
          id: 1,
          schedule: { id: 1 },
        },
        {
          id: 2,
          schedule: { id: 2 },
        },
      ],
    };

    it('should return available schedules grouped by date', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(mockAccessToken);

      const mockSchedules = [
        {
          id: 1,
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T10:30:00Z'),
          maxReservations: 3,
          _count: { reservations: 1 },
        },
        {
          id: 2,
          startTime: new Date('2024-01-01T11:00:00Z'),
          endTime: new Date('2024-01-01T11:30:00Z'),
          maxReservations: 3,
          _count: { reservations: 3 }, // 정원 초과
        },
      ];

      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.getAvailableSchedules(validToken);

      expect(result).toHaveProperty('schedules');
      expect(result).toHaveProperty('recipientEmail', 'applicant@example.com');
      expect(result.schedules['2024-01-01']).toHaveLength(1); // 정원 초과된 것은 제외
      expect(
        (result.schedules['2024-01-01'] as Array<{ id: number }>)[0].id,
      ).toBe(1);
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockAccessTokensService.validateToken.mockResolvedValue(null);

      await expect(
        service.getAvailableSchedules('invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no schedules found', async () => {
      const tokenWithNoSchedules = {
        ...mockAccessToken,
        schedules: [],
      };
      mockAccessTokensService.validateToken.mockResolvedValue(
        tokenWithNoSchedules,
      );

      await expect(service.getAvailableSchedules(validToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllBySchedule', () => {
    const scheduleId = 1;
    const userId = 1;

    it('should return reservations for a schedule', async () => {
      const mockSchedule = {
        id: scheduleId,
        userId,
      };

      const mockReservations = [
        {
          id: 1,
          scheduleId,
          applicantName: '홍길동',
          applicantEmail: 'test@example.com',
          status: 'confirmed',
          consultationRecord: null,
        },
      ];

      mockPrismaService.schedule.findFirst.mockResolvedValue(mockSchedule);
      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );

      const result = await service.findAllBySchedule(scheduleId, userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('applicantName', '홍길동');
    });

    it('should throw NotFoundException when schedule does not exist', async () => {
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllBySchedule(scheduleId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const reservationId = 1;
    const userId = 1;

    it('should return a reservation', async () => {
      const mockReservation = {
        id: reservationId,
        scheduleId: 1,
        applicantName: '홍길동',
        applicantEmail: 'test@example.com',
        schedule: {
          id: 1,
          userId,
        },
        consultationRecord: null,
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      const result = await service.findOne(reservationId, userId);

      expect(result).toHaveProperty('id', reservationId);
      expect(result).toHaveProperty('applicantName', '홍길동');
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(service.findOne(reservationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not authorized', async () => {
      const mockReservation = {
        id: reservationId,
        schedule: {
          id: 1,
          userId: 999, // 다른 사용자
        },
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      await expect(service.findOne(reservationId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
