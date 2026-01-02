import { IsDateString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateScheduleDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxReservations?: number;
}

