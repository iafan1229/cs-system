import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationRecordsService } from './consultation-records.service';

describe('ConsultationRecordsService', () => {
  let service: ConsultationRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultationRecordsService],
    }).compile();

    service = module.get<ConsultationRecordsService>(ConsultationRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
