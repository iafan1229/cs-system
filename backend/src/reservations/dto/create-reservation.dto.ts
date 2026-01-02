import { IsEmail, IsString, IsInt } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  scheduleId: number;

  @IsString()
  applicantName: string;

  @IsEmail()
  applicantEmail: string;
}

