import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Schedules (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // 테스트용 사용자 생성
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'schedule-test@example.com',
        password: hashedPassword,
        name: '스케줄 테스트',
        role: 'admin',
      },
    });
    userId = user.id;

    // 로그인하여 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'schedule-test@example.com',
        password: 'test123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.schedule.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });

    await app.close();
  });

  describe('POST /admin/schedules', () => {
    it('should create a schedule', () => {
      return request(app.getHttpServer())
        .post('/admin/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startTime: '2024-12-31T10:00:00Z',
          endTime: '2024-12-31T10:30:00Z',
          maxReservations: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('maxReservations', 3);
        });
    });

    it('should return 400 when duration is not 30 minutes', () => {
      return request(app.getHttpServer())
        .post('/admin/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startTime: '2024-12-31T10:00:00Z',
          endTime: '2024-12-31T10:45:00Z', // 45분
          maxReservations: 3,
        })
        .expect(400);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/admin/schedules')
        .send({
          startTime: '2024-12-31T10:00:00Z',
          endTime: '2024-12-31T10:30:00Z',
          maxReservations: 3,
        })
        .expect(401);
    });
  });

  describe('GET /admin/schedules', () => {
    it('should return schedules list', () => {
      return request(app.getHttpServer())
        .get('/admin/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter by date range', () => {
      return request(app.getHttpServer())
        .get('/admin/schedules?startDate=2024-12-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /admin/schedules/:id/generate-link', () => {
    let scheduleId: number;

    beforeAll(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          userId,
          startTime: new Date('2024-12-31T11:00:00Z'),
          endTime: new Date('2024-12-31T11:30:00Z'),
          maxReservations: 3,
        },
      });
      scheduleId = schedule.id;
    });

    afterAll(async () => {
      await prisma.accessTokenSchedule.deleteMany({
        where: { scheduleId },
      });
      await prisma.accessToken.deleteMany({
        where: {
          schedules: {
            some: { scheduleId },
          },
        },
      });
      await prisma.schedule.deleteMany({
        where: { id: scheduleId },
      });
    });

    it('should generate access token and send email', () => {
      return request(app.getHttpServer())
        .post(`/admin/schedules/${scheduleId}/generate-link`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'applicant@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('bookingUrl');
        });
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post(`/admin/schedules/${scheduleId}/generate-link`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });
});

