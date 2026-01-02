import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokensService } from './access-tokens.service';

describe('AccessTokensService', () => {
  let service: AccessTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessTokensService],
    }).compile();

    service = module.get<AccessTokensService>(AccessTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
