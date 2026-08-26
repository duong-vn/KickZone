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

  /**
   * 1. Gửi email khi người dùng vừa tạo đơn đặt sân (PENDING)
   */
  async sendBookingCreated(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    const subject = `Đã nhận yêu cầu đặt sân ${booking.code}`;
    const lines = [
      'KickZone đã nhận được yêu cầu đặt sân của bạn.',
      `Mã đặt sân: ${booking.code}`,
      `Sân: ${booking.field.name}`,
      `Địa chỉ: ${booking.field.address}, ${booking.field.district}, ${booking.field.city}`,
      `Bắt đầu: ${DATE_TIME_FORMATTER.format(new Date(booking.startTime))}`,
      `Kết thúc: ${DATE_TIME_FORMATTER.format(new Date(booking.endTime))}`,
      `Tổng tiền: ${PRICE_FORMATTER.format(booking.finalPrice)} ₫`,
      'Trạng thái: Chờ xác nhận (PENDING)',
    ];

    const html = this.renderBookingCreatedHtml(booking);
    await this.sendMail({
      to: recipient,
      subject,
      text: lines.join('\n'),
      html,
      logId: booking.id,
    });
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

  /**
   * 2. Gửi email khi Admin duyệt đơn đặt sân (CONFIRMED)
   */
  async sendBookingApproved(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    const subject = `[KickZone] Đặt sân thành công #${booking.code}`;
    const lines = [
      'Chúc mừng! Yêu cầu đặt sân của bạn đã được duyệt thành công.',
      `Mã đặt sân: ${booking.code}`,
      `Sân: ${booking.field.name}`,
      `Địa chỉ: ${booking.field.address}, ${booking.field.district}, ${booking.field.city}`,
      `Thời gian: ${DATE_TIME_FORMATTER.format(new Date(booking.startTime))} - ${DATE_TIME_FORMATTER.format(new Date(booking.endTime))}`,
      `Tổng tiền: ${PRICE_FORMATTER.format(booking.finalPrice)} ₫`,
      'Trạng thái: Đã xác nhận (CONFIRMED)',
    ];

    const html = this.renderBookingApprovedHtml(booking);
    await this.sendMail({
      to: recipient,
      subject,
      text: lines.join('\n'),
      html,
      logId: booking.id,
    });
  }

  enqueueBookingApproved(recipient: string, booking: BookingResponse): void {
    setImmediate(() => {
      this.sendBookingApproved(recipient, booking).catch((err: unknown) => {
        this.logger.error(
          `Background approval email failed for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    });
  }

  /**
   * 3. Gửi email khi Admin từ chối đơn đặt sân (REJECTED)
   */
  async sendBookingRejected(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    const subject = `[KickZone] Thông báo từ chối đặt sân #${booking.code}`;
    const lines = [
      'Rất tiếc, yêu cầu đặt sân của bạn đã bị từ chối.',
      `Mã đặt sân: ${booking.code}`,
      `Sân: ${booking.field.name}`,
      `Thời gian: ${DATE_TIME_FORMATTER.format(new Date(booking.startTime))} - ${DATE_TIME_FORMATTER.format(new Date(booking.endTime))}`,
      'Trạng thái: Bị từ chối (REJECTED)',
    ];
    if (booking.rejectionReason) {
      lines.push(`Lý do: ${booking.rejectionReason}`);
    }

    const html = this.renderBookingRejectedHtml(booking);
    await this.sendMail({
      to: recipient,
      subject,
      text: lines.join('\n'),
      html,
      logId: booking.id,
    });
  }

  enqueueBookingRejected(recipient: string, booking: BookingResponse): void {
    setImmediate(() => {
      this.sendBookingRejected(recipient, booking).catch((err: unknown) => {
        this.logger.error(
          `Background rejection email failed for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    });
  }

  /**
   * 4. Gửi email khi người dùng hủy đơn đặt sân (CANCELLED)
   */
  async sendBookingCancelled(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    const subject = `Đã hủy đặt sân ${booking.code}`;
    const lines = [
      'Yêu cầu đặt sân của bạn đã được hủy thành công.',
      `Mã đặt sân: ${booking.code}`,
      `Sân: ${booking.field.name}`,
      `Thời gian: ${DATE_TIME_FORMATTER.format(new Date(booking.startTime))} - ${DATE_TIME_FORMATTER.format(new Date(booking.endTime))}`,
      'Trạng thái: Đã hủy (CANCELLED)',
    ];
    if (booking.cancellationReason) {
      lines.push(`Lý do: ${booking.cancellationReason}`);
    }

    const html = this.renderBookingCancelledHtml(booking);
    await this.sendMail({
      to: recipient,
      subject,
      text: lines.join('\n'),
      html,
      logId: booking.id,
    });
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

  /**
   * 5. Gửi email khôi phục mật khẩu (Password Reset)
   */
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
    await this.sendMail({
      to: recipient,
      subject,
      text,
      html,
      logId: 'password-reset',
    });
  }

  /**
   * Hàm cốt lõi gửi email: Ưu tiên Resend HTTPS API (Port 443) -> Fallback SMTP
   */
  private async sendMail(payload: {
    to: string;
    subject: string;
    text: string;
    html: string;
    logId: string;
  }): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const from =
      process.env.EMAIL_FROM?.trim() ||
      (process.env.EMAIL_AUTH_USER
        ? `"KickZone" <${process.env.EMAIL_AUTH_USER}>`
        : 'KickZone <booking@mail.tduong.online>');

    // 1. Send via Resend HTTPS API (Port 443 - Works 100% on Render Free & Production)
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [payload.to],
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
          }),
        });

        if (!res.ok) {
          const errData = await res.text();
          this.logger.error(
            `Resend API failed for ${payload.logId} -> ${payload.to}: ${errData}`,
          );
        } else {
          this.logger.log(
            `Email successfully sent via Resend API to ${payload.to} (${payload.logId})`,
          );
        }
      } catch (err: unknown) {
        this.logger.error(
          `Resend API request failed for ${payload.logId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (this.shouldPreview()) {
        try {
          await this.openPreview(payload.html, payload.logId);
        } catch {
          this.logger.warn(`Email preview failed for ${payload.logId}`);
        }
      }
      return;
    }

    // 2. Fallback to Nodemailer SMTP (for localhost development without Resend key)
    try {
      const transporter = this.getTransporter(payload.logId);
      if (!transporter) return;
      await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      this.logger.log(
        `Email successfully sent via SMTP to ${payload.to} (${payload.logId})`,
      );
    } catch (err: unknown) {
      this.logger.error(
        `SMTP email failed for ${payload.logId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    if (this.shouldPreview()) {
      try {
        await this.openPreview(payload.html, payload.logId);
      } catch {
        this.logger.warn(`Email preview failed for ${payload.logId}`);
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
        `Email skipped for ${bookingId}: missing SMTP configuration and RESEND_API_KEY`,
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

  private getFrontendUrl(): string {
    return (
      process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') ||
      'http://localhost:3000'
    );
  }

  /**
   * Helper tạo khung Email Table tương thích 100% với mọi mail client (Gmail, Outlook, iOS Mail)
   */
  private wrapEmailLayout(options: {
    headerColor: string;
    headerIcon: string;
    headerTitle: string;
    headerSubtitle: string;
    bodyContent: string;
    ctaText?: string;
    ctaUrl?: string;
  }): string {
    const frontendUrl = this.getFrontendUrl();
    const ctaSection =
      options.ctaText && options.ctaUrl
        ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 12px 0;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${this.escapeHtml(options.ctaUrl)}" style="height:46px;v-text-anchor:middle;width:220px;" arcsize="18%" stroke="f" fillcolor="${options.headerColor}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${this.escapeHtml(options.ctaText)}</center>
            </v:roundrect>
            <![endif]-->
            <a href="${this.escapeHtml(options.ctaUrl)}" target="_blank" style="background-color:${options.headerColor};border-radius:10px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:46px;text-align:center;text-decoration:none;width:220px;-webkit-text-size-adjust:none;mso-hide:all;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
              ${this.escapeHtml(options.ctaText)} &rarr;
            </a>
          </td>
        </tr>
      </table>`
        : '';

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${this.escapeHtml(options.headerTitle)}</title>
    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
      body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      @media screen and (max-width: 600px) {
        .email-container { width: 100% !important; margin: auto !important; }
        .fluid { max-width: 100% !important; height: auto !important; }
        .stack-column { display: block !important; width: 100% !important; direction: ltr !important; }
        .mobile-padding { padding: 20px 16px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; color: #1e293b;">
    <center style="width: 100%; background-color: #f1f5f9;">
      <!-- Container -->
      <table class="email-container" align="center" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <tr>
          <td align="center" style="background-color: ${options.headerColor}; padding: 32px 24px 28px 24px; text-align: center;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <div style="display: inline-block; font-size: 32px; line-height: 1; margin-bottom: 8px;">
                    ${options.headerIcon}
                  </div>
                  <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; text-transform: uppercase;">
                    KICKZONE
                  </h1>
                  <p style="margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">
                    ${this.escapeHtml(options.headerSubtitle)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td class="mobile-padding" style="padding: 32px 28px 28px 28px; background-color: #ffffff;">
            ${options.bodyContent}
            ${ctaSection}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="font-size: 12px; color: #64748b; line-height: 1.6;">
                  <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">
                    ⚽ KickZone - Hệ thống đặt sân & quản lý bóng đá trực tuyến
                  </p>
                  <p style="margin: 0 0 10px 0;">
                    Website: <a href="${this.escapeHtml(frontendUrl)}" target="_blank" style="color: #006e2f; text-decoration: none; font-weight: 500;">${this.escapeHtml(frontendUrl)}</a> &bull; Hotline: <span style="color: #0f172a; font-weight: 500;">1900 6868</span>
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    Email này được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp nếu không cần thiết.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </center>
  </body>
</html>`;
  }

  /**
   * Helper tạo bảng hiển thị chi tiết đơn đặt sân (Field Details Table)
   */
  private renderBookingDetailsCard(
    booking: BookingResponse,
    accentColor: string,
  ): string {
    const startTimeFormatted = DATE_TIME_FORMATTER.format(
      new Date(booking.startTime),
    );
    const endTimeFormatted = DATE_TIME_FORMATTER.format(
      new Date(booking.endTime),
    );
    const finalPriceFormatted = `${PRICE_FORMATTER.format(booking.finalPrice)} ₫`;
    const discountFormatted =
      booking.discountAmount > 0
        ? `-${PRICE_FORMATTER.format(booking.discountAmount)} ₫`
        : null;

    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="padding: 7px 0; color: #64748b; width: 35%;">🏟️ Sân bóng:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: #0f172a;">${this.escapeHtml(booking.field.name)}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b;">📍 Địa chỉ:</td>
              <td style="padding: 7px 0; text-align: right; color: #334155;">${this.escapeHtml(booking.field.address)}, ${this.escapeHtml(booking.field.district)}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b;">⏰ Giờ bắt đầu:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: ${accentColor};">${this.escapeHtml(startTimeFormatted)}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b;">🏁 Giờ kết thúc:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: ${accentColor};">${this.escapeHtml(endTimeFormatted)}</td>
            </tr>
            ${
              discountFormatted
                ? `
            <tr>
              <td style="padding: 7px 0; color: #64748b;">🏷️ Voucher giảm giá:</td>
              <td style="padding: 7px 0; text-align: right; color: #dc2626; font-weight: 600;">${this.escapeHtml(discountFormatted)}</td>
            </tr>`
                : ''
            }
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 12px 0 4px 0; font-size: 15px; font-weight: 700; color: #0f172a;">💳 Tổng thanh toán:</td>
              <td style="padding: 12px 0 4px 0; text-align: right; font-size: 17px; font-weight: 700; color: ${accentColor};">${this.escapeHtml(finalPriceFormatted)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }

  private renderBookingCreatedHtml(booking: BookingResponse): string {
    const frontendUrl = this.getFrontendUrl();
    const detailsCard = this.renderBookingDetailsCard(booking, '#006e2f');

    const bodyContent = `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
        Yêu cầu đặt sân đã được ghi nhận!
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Cảm ơn bạn đã lựa chọn <strong>KickZone</strong>. Đơn đặt sân của bạn hiện đang được chuyển đến ban quản lý sân để xác nhận lịch.
      </p>

      ${detailsCard}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; margin: 18px 0 0 0;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
              ⏳ <strong>Trạng thái:</strong> <span style="background-color:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-weight:600;">CHỜ XÁC NHẬN (PENDING)</span>. Hệ thống sẽ tự động gửi email thông báo ngay khi chủ sân duyệt đơn.
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.wrapEmailLayout({
      headerColor: '#006e2f',
      headerIcon: '⚽',
      headerTitle: `Xác nhận đặt sân #${booking.code}`,
      headerSubtitle: `Yêu cầu đặt sân #${booking.code}`,
      bodyContent,
      ctaText: 'Xem đơn đặt sân',
      ctaUrl: `${frontendUrl}/my-bookings`,
    });
  }

  private renderBookingApprovedHtml(booking: BookingResponse): string {
    const frontendUrl = this.getFrontendUrl();
    const detailsCard = this.renderBookingDetailsCard(booking, '#006e2f');

    const bodyContent = `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
        🎉 Chúc mừng! Đơn đặt sân đã được xác nhận
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Chủ sân bóng <strong>${this.escapeHtml(booking.field.name)}</strong> đã duyệt lịch thi đấu của bạn. Chúc bạn và các chiến hữu có một trận cầu bùng nổ và sảng khoái!
      </p>

      ${detailsCard}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; margin: 18px 0 0 0;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
              ✅ <strong>Trạng thái:</strong> <span style="background-color:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-weight:600;">ĐÃ DUYỆT (CONFIRMED)</span>. Vui lòng đến sân trước 10-15 phút để chuẩn bị trang phục và khởi động.
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.wrapEmailLayout({
      headerColor: '#006e2f',
      headerIcon: '🏆',
      headerTitle: `Đặt sân thành công #${booking.code}`,
      headerSubtitle: `Lịch thi đấu đã xác nhận #${booking.code}`,
      bodyContent,
      ctaText: 'Xem chi tiết đơn',
      ctaUrl: `${frontendUrl}/my-bookings`,
    });
  }

  private renderBookingRejectedHtml(booking: BookingResponse): string {
    const frontendUrl = this.getFrontendUrl();
    const detailsCard = this.renderBookingDetailsCard(booking, '#b91c1c');

    const bodyContent = `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
        Rất tiếc, đơn đặt sân không thể thực hiện
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Yêu cầu đặt sân của bạn tại <strong>${this.escapeHtml(booking.field.name)}</strong> đã bị từ chối do trùng lịch hoặc điều kiện sân bãi không cho phép.
      </p>

      ${detailsCard}

      ${
        booking.rejectionReason
          ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; margin: 18px 0 0 0;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
              ⚠️ <strong>Lý do từ chối:</strong> ${this.escapeHtml(booking.rejectionReason)}
            </p>
          </td>
        </tr>
      </table>`
          : ''
      }
      <p style="margin: 18px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
        Bạn có thể tìm kiếm các khung giờ hoặc sân bóng khác phù hợp trên hệ thống KickZone.
      </p>
    `;

    return this.wrapEmailLayout({
      headerColor: '#b91c1c',
      headerIcon: '⚠️',
      headerTitle: `Từ chối đặt sân #${booking.code}`,
      headerSubtitle: `Thông báo đơn đặt sân #${booking.code}`,
      bodyContent,
      ctaText: 'Tìm sân bóng khác',
      ctaUrl: `${frontendUrl}/fields`,
    });
  }

  private renderBookingCancelledHtml(booking: BookingResponse): string {
    const frontendUrl = this.getFrontendUrl();
    const detailsCard = this.renderBookingDetailsCard(booking, '#475569');

    const bodyContent = `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
        Đơn đặt sân đã được hủy thành công
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Yêu cầu đặt sân tại <strong>${this.escapeHtml(booking.field.name)}</strong> đã được hủy theo yêu cầu.
      </p>

      ${detailsCard}

      ${
        booking.cancellationReason
          ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 18px 0 0 0;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
              ℹ️ <strong>Lý do hủy:</strong> ${this.escapeHtml(booking.cancellationReason)}
            </p>
          </td>
        </tr>
      </table>`
          : ''
      }
    `;

    return this.wrapEmailLayout({
      headerColor: '#475569',
      headerIcon: '🚫',
      headerTitle: `Hủy đơn đặt sân #${booking.code}`,
      headerSubtitle: `Thông báo hủy đơn #${booking.code}`,
      bodyContent,
      ctaText: 'Đặt sân mới',
      ctaUrl: `${frontendUrl}/fields`,
    });
  }

  private renderPasswordResetHtml(subject: string, resetUrl: string): string {
    const bodyContent = `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
        Yêu cầu thiết lập lại mật khẩu
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Xin chào, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản KickZone của bạn. Vui lòng bấm vào nút bên dưới để tạo mật khẩu mới.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; margin: 16px 0;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
              ⏰ <strong>Lưu ý:</strong> Liên kết đặt lại mật khẩu này có hiệu lực trong vòng <strong>15 phút</strong> kể từ khi gửi.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin: 24px 0 6px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
        Nếu nút bấm không hoạt động, bạn có thể sao chép liên kết trực tiếp sau vào thanh địa chỉ trình duyệt:
      </p>
      <p style="margin: 0 0 20px 0; font-size: 12px; color: #0284c7; word-break: break-all; background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <a href="${this.escapeHtml(resetUrl)}" target="_blank" style="color: #0284c7; text-decoration: underline;">${this.escapeHtml(resetUrl)}</a>
      </p>

      <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        Nếu bạn không thực hiện yêu cầu này, hãy yên tâm bỏ qua email. Tài khoản của bạn vẫn được bảo mật an toàn.
      </p>
    `;

    return this.wrapEmailLayout({
      headerColor: '#006e2f',
      headerIcon: '🔐',
      headerTitle: this.escapeHtml(subject),
      headerSubtitle: 'Bảo mật tài khoản KickZone',
      bodyContent,
      ctaText: 'Đặt lại mật khẩu ngay',
      ctaUrl: resetUrl,
    });
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
