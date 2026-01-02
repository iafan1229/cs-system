import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateConsultationRecordDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}

