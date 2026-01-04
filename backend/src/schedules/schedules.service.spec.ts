import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokensService } from '../access-tokens/access-tokens.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let prismaService: PrismaService;
  let accessTokensService: AccessTokensService;

  const mockPrismaService = {
    schedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAccessTokensService = {
    generateToken: jest.fn(),
    generateTokensForSchedules: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
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

    service = module.get<SchedulesService>(SchedulesService);
    prismaService = module.get<PrismaService>(PrismaService);
    accessTokensService = module.get<AccessTokensService>(AccessTokensService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 1;
    const createScheduleDto: CreateScheduleDto = {
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:30:00Z',
      maxReservations: 3,
    };

    it('should create a schedule successfully', async () => {
      const mockSchedule = {
        id: 1,
        userId,
        startTime: new Date(createScheduleDto.startTime),
        endTime: new Date(createScheduleDto.endTime),
        maxReservations: 3,
        reservations: [],
      };

      mockPrismaService.schedule.findFirst.mockResolvedValue(null); // 중복 없음
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(userId, createScheduleDto);

      expect(mockPrismaService.schedule.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('maxReservations', 3);
    });

    it('should throw BadRequestException when duration is not 30 minutes', async () => {
      const invalidDto: CreateScheduleDto = {
        ...createScheduleDto,
        endTime: '2024-01-01T10:45:00Z', // 45분
      };

      await expect(service.create(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when startTime >= endTime', async () => {
      const invalidDto: CreateScheduleDto = {
        startTime: '2024-01-01T10:30:00Z',
        endTime: '2024-01-01T10:00:00Z',
        maxReservations: 3,
      };

      await expect(service.create(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when time slot overlaps', async () => {
      const existingSchedule = {
        id: 1,
        userId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:30:00Z'),
      };

      mockPrismaService.schedule.findFirst.mockResolvedValue(existingSchedule);

      await expect(service.create(userId, createScheduleDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should use default maxReservations (3) when not provided', async () => {
      const dtoWithoutMax: CreateScheduleDto = {
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T10:30:00Z',
      };

      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.schedule.create.mockResolvedValue({
        id: 1,
        userId,
        maxReservations: 3,
      });

      await service.create(userId, dtoWithoutMax);

      expect(mockPrismaService.schedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maxReservations: 3,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const userId = 1;

    it('should return all schedules for a user', async () => {
      const mockSchedules = [
        {
          id: 1,
          userId,
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T10:30:00Z'),
          maxReservations: 3,
          reservations: [],
        },
      ];

      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 1);
    });

    it('should filter by date range when provided', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockPrismaService.schedule.findMany.mockResolvedValue([]);

      await service.findAll(userId, startDate, endDate);

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            startTime: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const scheduleId = 1;
    const userId = 1;

    it('should return a schedule', async () => {
      const mockSchedule = {
        id: scheduleId,
        userId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:30:00Z'),
        maxReservations: 3,
        reservations: [],
      };

      mockPrismaService.schedule.findFirst.mockResolvedValue(mockSchedule);

      const result = await service.findOne(scheduleId, userId);

      expect(result).toHaveProperty('id', scheduleId);
    });

    it('should throw NotFoundException when schedule does not exist', async () => {
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);

      await expect(service.findOne(scheduleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const scheduleId = 1;
    const userId = 1;
    const updateScheduleDto: UpdateScheduleDto = {
      startTime: '2024-01-01T11:00:00Z',
      endTime: '2024-01-01T11:30:00Z',
      maxReservations: 5,
    };

    it('should update a schedule successfully', async () => {
      const existingSchedule = {
        id: scheduleId,
        userId,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:30:00Z'),
        maxReservations: 3,
      };

      const updatedSchedule = {
        ...existingSchedule,
        ...updateScheduleDto,
        startTime: new Date(updateScheduleDto.startTime!),
        endTime: new Date(updateScheduleDto.endTime!),
      };

      mockPrismaService.schedule.findFirst
        .mockResolvedValueOnce(existingSchedule) // 소유자 확인
        .mockResolvedValueOnce(null); // 중복 없음
      mockPrismaService.schedule.update.mockResolvedValue(updatedSchedule);

      const result = await service.update(scheduleId, userId, updateScheduleDto);

      expect(mockPrismaService.schedule.update).toHaveBeenCalled();
      expect(result).toHaveProperty('maxReservations', 5);
    });

    it('should throw NotFoundException when schedule does not exist', async () => {
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);

      await expect(
        service.update(scheduleId, userId, updateScheduleDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const scheduleId = 1;
    const userId = 1;

    it('should delete a schedule successfully', async () => {
      const mockSchedule = {
        id: scheduleId,
        userId,
        reservations: [],
      };

      mockPrismaService.schedule.findFirst.mockResolvedValue(mockSchedule);
      mockPrismaService.schedule.delete.mockResolvedValue(mockSchedule);

      await service.remove(scheduleId, userId);

      expect(mockPrismaService.schedule.delete).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
    });

    it('should throw NotFoundException when schedule does not exist', async () => {
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);

      await expect(service.remove(scheduleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
