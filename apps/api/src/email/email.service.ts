import { Injectable, Logger } from '@nestjs/common';
import type { BookingResponse } from '../bookings/bookings.service.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendBookingCancelled(
    recipient: string,
    booking: BookingResponse,
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      this.logger.warn(
        `Cancellation email skipped for booking ${booking.id}: missing configuration`,
      );
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: `Booking ${booking.code} has been cancelled`,
          text: [
            `Booking ${booking.code} has been cancelled.`,
            `Field: ${booking.field.name}`,
            `Start: ${booking.startTime}`,
            `End: ${booking.endTime}`,
          ].join('\n'),
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.error(
          `Cancellation email failed for booking ${booking.id}`,
        );
      }
    } catch {
      this.logger.error(`Cancellation email failed for booking ${booking.id}`);
    }
  }
}
