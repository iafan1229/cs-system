import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ScheduleRepository } from '../repositories/schedule.repository';

@Injectable()
export class ScheduleDomainService {
  constructor(private scheduleRepository: ScheduleRepository) {}

  validateTimeSlot(startTime: Date, endTime: Date): void {
    const duration = endTime.getTime() - startTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (duration !== thirtyMinutes) {
      throw new BadRequestException('Schedule must be exactly 30 minutes');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  async validateNoOverlap(
    userId: number,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: number,
  ): Promise<void> {
    const overlapping = await this.scheduleRepository.findOverlapping(
      userId,
      startTime,
      endTime,
      excludeScheduleId,
    );

    if (overlapping) {
      throw new ConflictException('Time slot overlaps with existing schedule');
    }
  }
}

