import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationRecordsController } from './consultation-records.controller';

describe('ConsultationRecordsController', () => {
  let controller: ConsultationRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultationRecordsController],
    }).compile();

    controller = module.get<ConsultationRecordsController>(ConsultationRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
