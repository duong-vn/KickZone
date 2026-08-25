import { Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { unlink, writeFile } from 'node:fs/promises';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import { booking_status } from '../generated/prisma/client.js';
import type { BookingResponse } from '../bookings/bookings.service.js';
import { EmailService } from './email.service.js';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));
jest.mock('node:child_process', () => ({ spawn: jest.fn() }));
jest.mock('node:fs/promises', () => ({
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

const booking: BookingResponse = {
  id: 'booking-id',
  code: 'KZ-TEST',
  field: {
    id: 'field-id',
    name: 'Sân Trung Tâm',
    address: '1 Nguyễn Huệ',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    type: null,
    primaryImagePath: null,
  },
  voucher: null,
  startTime: '2030-01-01T11:00:00.000Z',
  endTime: '2030-01-01T12:00:00.000Z',
  status: booking_status.PENDING,
  originalPrice: 200_000,
  discountAmount: 0,
  finalPrice: 200_000,
  cancellationReason: null,
  rejectionReason: null,
  createdAt: '2030-01-01T00:00:00.000Z',
  updatedAt: '2030-01-01T00:00:00.000Z',
};

describe('EmailService', () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const createTransport = jest.mocked(nodemailer.createTransport);
  const spawnPreview = jest.mocked(spawn);
  const writePreview = jest.mocked(writeFile);
  const removePreview = jest.mocked(unlink);
  const sendMail = jest.fn<Promise<{ messageId: string }>, [SendMailOptions]>();
  let sentMessage: SendMailOptions | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_AUTH_USER = 'mailer@example.com';
    process.env.EMAIL_AUTH_PASS = 'test-password';
    process.env.EMAIL_PREVIEW = 'false';
    process.env.NODE_ENV = 'test';
    sentMessage = undefined;
    sendMail.mockImplementation((options: SendMailOptions) => {
      sentMessage = options;
      return Promise.resolve({ messageId: 'message-id' });
    });
    createTransport.mockReturnValue({ sendMail });
    spawnPreview.mockReturnValue({
      once: jest.fn(),
      unref: jest.fn(),
    } as never);
    writePreview.mockResolvedValue(undefined);
    removePreview.mockResolvedValue(undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_AUTH_USER;
    delete process.env.EMAIL_AUTH_PASS;
    delete process.env.EMAIL_PREVIEW;
    delete process.env.NODE_ENV;
    jest.restoreAllMocks();
  });

  it('sends a booking-created email through STARTTLS SMTP', async () => {
    const service = new EmailService();

    await service.sendBookingCreated('user@example.com', booking);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        requireTLS: true,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"KickZone" <mailer@example.com>',
        to: 'user@example.com',
        subject: 'Đã nhận yêu cầu đặt sân KZ-TEST',
      }),
    );
  });

  it('includes the cancellation reason in a cancellation email', async () => {
    const service = new EmailService();

    await service.sendBookingCancelled('user@example.com', {
      ...booking,
      status: booking_status.CANCELLED,
      cancellationReason: 'Thay đổi kế hoạch',
    });

    expect(sentMessage?.subject).toBe('Đã hủy đặt sân KZ-TEST');
    expect(typeof sentMessage?.text).toBe('string');
    if (typeof sentMessage?.text === 'string') {
      expect(sentMessage.text).toContain('Lý do: Thay đổi kế hoạch');
    }
  });

  it('skips email when SMTP configuration is incomplete', async () => {
    delete process.env.EMAIL_AUTH_PASS;
    const service = new EmailService();

    await service.sendBookingCreated('user@example.com', booking);

    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('does not fail the booking flow when SMTP rejects the email', async () => {
    sendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));
    const service = new EmailService();

    await expect(
      service.sendBookingCreated('user@example.com', booking),
    ).resolves.toBeUndefined();
  });

  it('opens a temporary HTML preview only when enabled outside production', async () => {
    process.env.EMAIL_PREVIEW = 'true';
    process.env.NODE_ENV = 'development';
    const service = new EmailService();

    await service.sendBookingCreated('user@example.com', booking);

    expect(writePreview).toHaveBeenCalledTimes(1);
    expect(spawnPreview).toHaveBeenCalledTimes(1);
  });
});
