import { IsDateString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxReservations?: number;
}

