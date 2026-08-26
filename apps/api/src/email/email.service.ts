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

  enqueueBookingCreated(recipient: string, booking: BookingResponse): void {
    setImmediate(() => {
      this.sendBookingCreated(recipient, booking).catch((err: unknown) => {
        this.logger.error(
          `Background email failed for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    });
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

  enqueueBookingCancelled(recipient: string, booking: BookingResponse): void {
    setImmediate(() => {
      this.sendBookingCancelled(recipient, booking).catch((err: unknown) => {
        this.logger.error(
          `Background cancellation email failed for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    });
  }

  async sendPasswordResetEmail(
    recipient: string,
    resetUrl: string,
  ): Promise<void> {
    const subject = 'Khôi phục mật khẩu tài khoản KickZone';
    const text = [
      'Chào bạn,',
      '',
      'KickZone nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.',
      'Vui lòng truy cập liên kết sau để thiết lập mật khẩu mới (liên kết có hiệu lực trong vòng 15 phút):',
      resetUrl,
      '',
      'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với chúng tôi để được hỗ trợ.',
      '',
      'Trân trọng,',
      'Đội ngũ KickZone',
    ].join('\n');

    const html = this.renderPasswordResetHtml(subject, resetUrl);
    const from = process.env.EMAIL_AUTH_USER;

    try {
      const transporter = this.getTransporter('password-reset');
      if (!transporter || !from) return;
      await transporter.sendMail({
        from: `"KickZone" <${from}>`,
        to: recipient,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Password reset email failed for ${recipient}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    if (this.shouldPreview()) {
      try {
        await this.openPreview(html, 'password-reset');
      } catch {
        this.logger.warn(`Email preview failed for password reset`);
      }
    }
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
    } catch (error) {
      this.logger.error(
        `Email failed for booking ${booking.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
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
    const port = Number(process.env.EMAIL_PORT ?? 587);
    const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
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

  private renderPasswordResetHtml(subject: string, resetUrl: string): string {
    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(subject)}</title>
  </head>
  <body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;background-color:#f8fafc;margin:0;padding:24px;line-height:1.6">
    <main style="max-width:540px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">
      <div style="background-color:#16a34a;padding:28px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px">KickZone</h1>
        <p style="color:#dcfce7;margin:6px 0 0 0;font-size:14px">Hệ thống đặt sân bóng đá trực tuyến</p>
      </div>
      <div style="padding:32px 28px">
        <h2 style="color:#0f172a;font-size:18px;font-weight:600;margin:0 0 16px 0">Yêu cầu khôi phục mật khẩu</h2>
        <p style="margin:0 0 16px 0;font-size:15px;color:#334155">Xin chào,</p>
        <p style="margin:0 0 24px 0;font-size:15px;color:#334155;line-height:1.6">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản KickZone của bạn. Vui lòng bấm vào nút bên dưới để tạo mật khẩu mới. Liên kết này sẽ hết hạn sau <strong>15 phút</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${this.escapeHtml(resetUrl)}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(22,163,74,0.3)">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="margin:24px 0 8px 0;font-size:13px;color:#64748b;line-height:1.5">
          Nếu nút bấm trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:
        </p>
        <p style="margin:0 0 24px 0;font-size:12px;color:#0284c7;word-break:break-all">
          <a href="${this.escapeHtml(resetUrl)}" style="color:#0284c7">${this.escapeHtml(resetUrl)}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5">
          Nếu bạn không thực hiện yêu cầu này, hãy yên tâm bỏ qua email. Mật khẩu của bạn vẫn được giữ an toàn.
        </p>
      </div>
      <div style="background-color:#f1f5f9;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#64748b">&copy; KickZone - Nền tảng kết nối đam mê bóng đá</p>
      </div>
    </main>
  </body>
</html>`;
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
