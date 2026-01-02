import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AccessTokensService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async generateToken(scheduleId: number, userEmail: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { user: true },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    const accessToken = await this.prisma.accessToken.create({
      data: {
        token,
        scheduleId,
        expiresAt,
      },
    });

    // 이메일 발송
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const bookingUrl = `${frontendUrl}/booking?token=${token}`;

    await this.sendEmail(userEmail, bookingUrl, schedule);

    return {
      token: accessToken.token,
      expiresAt: accessToken.expiresAt,
      bookingUrl,
    };
  }

  private async sendEmail(
    to: string,
    bookingUrl: string,
    schedule: { startTime: Date | string },
  ): Promise<void> {
    const startTime =
      schedule.startTime instanceof Date
        ? schedule.startTime
        : new Date(schedule.startTime);

    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailUser = this.configService.get<string>('EMAIL_USER');

    // 이메일 설정이 없을 때만 콘솔에 출력 (실제 발송은 시도하지 않음)
    if (!emailHost || !emailUser) {
      console.log('\n📧 [이메일 설정 없음] 이메일 발송 스킵');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('To:', to);
      console.log(
        'From:',
        this.configService.get<string>('EMAIL_FROM') || 'noreply@example.com',
      );
      console.log('Subject: 상담 예약 신청 링크');
      console.log('상담 시간:', startTime.toLocaleString('ko-KR'));
      console.log('Booking URL:', bookingUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(
        '💡 실제 이메일 발송을 원하면 .env에 EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD를 설정하세요.\n',
      );
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: '상담 예약 신청 링크',
      html: `
        <h2>상담 예약 신청 링크</h2>
        <p>아래 링크를 통해 상담을 예약하실 수 있습니다.</p>
        <p><strong>상담 시간:</strong> ${startTime.toLocaleString('ko-KR')}</p>
        <p><a href="${bookingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">예약하기</a></p>
        <p>또는 아래 URL을 복사하여 사용하세요:</p>
        <p>${bookingUrl}</p>
        <p><small>이 링크는 7일 후 만료됩니다.</small></p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ 이메일 발송 성공: ${to}`);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('❌ 이메일 발송 실패:', err.message || error);
      if (err.code === 'EAUTH') {
        console.error(
          '💡 인증 실패: EMAIL_USER와 EMAIL_PASSWORD를 확인하세요.',
        );
        console.error('   Gmail 사용 시: 앱 비밀번호가 필요할 수 있습니다.');
        console.error('   네이버 사용 시: 계정 비밀번호를 확인하세요.');
      }
      // 이메일 발송 실패해도 토큰은 생성되었으므로 계속 진행
      // 프로덕션 환경에서는 에러를 throw하거나 로깅 서비스에 전송할 수 있음
    }
  }

  async validateToken(token: string) {
    const accessToken = await this.prisma.accessToken.findUnique({
      where: { token },
      include: {
        schedule: {
          include: {
            _count: {
              select: {
                reservations: true,
              },
            },
          },
        },
      },
    });

    if (!accessToken) {
      return null;
    }

    if (accessToken.used) {
      return null;
    }

    if (new Date() > accessToken.expiresAt) {
      return null;
    }

    return accessToken;
  }

  async markAsUsed(token: string) {
    return this.prisma.accessToken.update({
      where: { token },
      data: { used: true },
    });
  }
}
