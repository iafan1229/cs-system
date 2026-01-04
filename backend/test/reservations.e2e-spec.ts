import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Reservations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let scheduleId: number;
  let accessToken: string;

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
        email: 'test@example.com',
        password: hashedPassword,
        name: '테스트 사용자',
        role: 'admin',
      },
    });
    userId = user.id;

    // 로그인하여 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123',
      });

    authToken = loginResponse.body.access_token;

    // 테스트용 스케줄 생성
    const schedule = await prisma.schedule.create({
      data: {
        userId,
        startTime: new Date('2024-12-31T10:00:00Z'),
        endTime: new Date('2024-12-31T10:30:00Z'),
        maxReservations: 3,
      },
    });
    scheduleId = schedule.id;

    // AccessToken 생성
    const tokenResponse = await request(app.getHttpServer())
      .post(`/admin/schedules/${scheduleId}/generate-link`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'applicant@example.com',
      });

    accessToken = tokenResponse.body.token;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.reservation.deleteMany({
      where: { scheduleId },
    });
    await prisma.accessTokenSchedule.deleteMany({
      where: { scheduleId },
    });
    await prisma.accessToken.deleteMany({
      where: { token: accessToken },
    });
    await prisma.schedule.deleteMany({
      where: { id: scheduleId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });

    await app.close();
  });

  describe('GET /public/schedules', () => {
    it('should return available schedules', () => {
      return request(app.getHttpServer())
        .get(`/public/schedules?token=${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('schedules');
          expect(res.body).toHaveProperty('recipientEmail', 'applicant@example.com');
        });
    });

    it('should return 400 for invalid token', () => {
      return request(app.getHttpServer())
        .get('/public/schedules?token=invalid-token')
        .expect(400);
    });
  });

  describe('POST /public/reservations', () => {
    it('should create a reservation', () => {
      return request(app.getHttpServer())
        .post(`/public/reservations?token=${accessToken}`)
        .send({
          scheduleId,
          applicantName: '홍길동',
          applicantEmail: 'hong@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('applicantName', '홍길동');
          expect(res.body).toHaveProperty('status', 'confirmed');
        });
    });

    it('should prevent overbooking (concurrency test)', async () => {
      // 정원이 3명인 스케줄에 3명이 동시에 예약 시도
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post(`/public/reservations?token=${accessToken}`)
          .send({
            scheduleId,
            applicantName: `사용자${i + 1}`,
            applicantEmail: `user${i + 1}@example.com`,
          }),
      );

      const results = await Promise.allSettled(promises);

      // 성공한 예약 수 확인
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 201,
      );
      const failed = results.filter(
        (r) =>
          r.status === 'fulfilled' && r.value.status === 409, // ConflictException
      );

      // 정원(3명)을 초과하지 않아야 함
      expect(successful.length).toBeLessThanOrEqual(3);
      expect(failed.length).toBeGreaterThanOrEqual(2); // 최소 2명은 실패해야 함

      // 실제 예약 수 확인
      const reservations = await prisma.reservation.count({
        where: { scheduleId },
      });
      expect(reservations).toBeLessThanOrEqual(3);
    }, 10000); // 타임아웃 10초

    it('should return 400 for invalid token', () => {
      return request(app.getHttpServer())
        .post('/public/reservations?token=invalid-token')
        .send({
          scheduleId,
          applicantName: '홍길동',
          applicantEmail: 'hong@example.com',
        })
        .expect(400);
    });

    it('should return 400 for invalid schedule ID', () => {
      return request(app.getHttpServer())
        .post(`/public/reservations?token=${accessToken}`)
        .send({
          scheduleId: 99999,
          applicantName: '홍길동',
          applicantEmail: 'hong@example.com',
        })
        .expect(400);
    });
  });

  describe('GET /admin/schedules/:id/reservations', () => {
    it('should return reservations for a schedule', () => {
      return request(app.getHttpServer())
        .get(`/admin/schedules/${scheduleId}/reservations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/admin/schedules/${scheduleId}/reservations`)
        .expect(401);
    });
  });
});

