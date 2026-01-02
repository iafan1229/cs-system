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
      secure: false,
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
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
    schedule: any,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: '상담 예약 신청 링크',
      html: `
        <h2>상담 예약 신청 링크</h2>
        <p>아래 링크를 통해 상담을 예약하실 수 있습니다.</p>
        <p><strong>상담 시간:</strong> ${new Date(schedule.startTime).toLocaleString('ko-KR')}</p>
        <p><a href="${bookingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">예약하기</a></p>
        <p>또는 아래 URL을 복사하여 사용하세요:</p>
        <p>${bookingUrl}</p>
        <p><small>이 링크는 7일 후 만료됩니다.</small></p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      // 이메일 발송 실패해도 토큰은 생성되었으므로 계속 진행
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
