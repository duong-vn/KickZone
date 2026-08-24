import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type { BookingResponse } from '../bookings/bookings.service.js';

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const PRICE_FORMATTER = new Intl.NumberFormat('vi-VN');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: Transporter;

  async sendBookingCreated(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    await this.sendBookingEmail(
      recipient,
      booking,
      `Đã nhận yêu cầu đặt sân ${booking.code}`,
      [
        'KickZone đã nhận yêu cầu đặt sân của bạn.',
        `Mã đặt sân: ${booking.code}`,
        `Sân: ${booking.field.name}`,
        `Địa chỉ: ${booking.field.address}, ${booking.field.district}, ${booking.field.city}`,
        `Bắt đầu: ${DATE_TIME_FORMATTER.format(new Date(booking.startTime))}`,
        `Kết thúc: ${DATE_TIME_FORMATTER.format(new Date(booking.endTime))}`,
        `Tổng tiền: ${PRICE_FORMATTER.format(booking.finalPrice)} ₫`,
        'Trạng thái: Chờ xác nhận',
      ],
    );
  }

  async sendBookingCancelled(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    const lines = [
      'Yêu cầu đặt sân của bạn đã được hủy.',
      `Mã đặt sân: ${booking.code}`,
      `Sân: ${booking.field.name}`,
      `Bắt đầu: ${DATE_TIME_FORMATTER.format(new Date(booking.startTime))}`,
      `Kết thúc: ${DATE_TIME_FORMATTER.format(new Date(booking.endTime))}`,
      'Trạng thái: Đã hủy',
    ];
    if (booking.cancellationReason) {
      lines.push(`Lý do: ${booking.cancellationReason}`);
    }
    await this.sendBookingEmail(
      recipient,
      booking,
      `Đã hủy đặt sân ${booking.code}`,
      lines,
    );
  }

  private async sendBookingEmail(
    recipient: string,
    booking: BookingResponse,
    subject: string,
    lines: string[],
  ): Promise<void> {
    const from = process.env.EMAIL_AUTH_USER;
    const text = lines.join('\n');
    const html = this.renderHtml(subject, text);
    try {
      const transporter = this.getTransporter(booking.id);
      if (!transporter || !from) return;
      await transporter.sendMail({
        from: `"KickZone" <${from}>`,
        to: recipient,
        subject,
        text,
        html,
      });
    } catch {
      this.logger.error(`Email failed for booking ${booking.id}`);
      return;
    }

    if (this.shouldPreview()) {
      try {
        await this.openPreview(html, booking.id);
      } catch {
        this.logger.warn(`Email preview failed for booking ${booking.id}`);
      }
    }
  }

  private getTransporter(bookingId: string): Transporter | null {
    if (this.transporter) return this.transporter;
    const host = process.env.EMAIL_HOST;
    const user = process.env.EMAIL_AUTH_USER;
    const pass = process.env.EMAIL_AUTH_PASS;
    if (!host || !user || !pass) {
      this.logger.warn(
        `Email skipped for booking ${bookingId}: missing SMTP configuration`,
      );
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
      auth: { user, pass },
    });
    return this.transporter;
  }

  private shouldPreview(): boolean {
    return (
      process.env.EMAIL_PREVIEW?.trim().toLowerCase() === 'true' &&
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test'
    );
  }

  private renderHtml(subject: string, text: string): string {
    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>${this.escapeHtml(subject)}</title>
  </head>
  <body style="font-family:Arial,sans-serif;color:#191c1d;line-height:1.6">
    <main style="max-width:640px;margin:32px auto;padding:24px;border:1px solid #dce5d9;border-radius:12px">
      <h1 style="color:#166534;font-size:24px">KickZone</h1>
      <div style="white-space:pre-line">${this.escapeHtml(text)}</div>
    </main>
  </body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return entities[character];
    });
  }

  private async openPreview(html: string, bookingId: string): Promise<void> {
    const filePath = join(
      tmpdir(),
      `kickzone-email-${bookingId}-${randomUUID()}.html`,
    );
    await writeFile(filePath, html, { encoding: 'utf8', mode: 0o600 });
    const url = pathToFileURL(filePath).href;
    const [command, args] =
      process.platform === 'win32'
        ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
        : process.platform === 'darwin'
          ? ['open', [url]]
          : ['xdg-open', [url]];
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.once('error', () => {
      this.logger.warn(`Could not open email preview for booking ${bookingId}`);
    });
    child.unref();

    const cleanup = setTimeout(() => {
      void unlink(filePath).catch(() => undefined);
    }, 60_000);
    cleanup.unref();
  }
}
