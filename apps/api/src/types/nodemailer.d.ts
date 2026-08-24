declare module 'nodemailer' {
  export interface SendMailOptions {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  export function createTransport(options: {
    host: string;
    port: number;
    secure: boolean;
    requireTLS: boolean;
    connectionTimeout: number;
    greetingTimeout: number;
    socketTimeout: number;
    auth: { user: string; pass: string };
  }): Transporter;

  const nodemailer: {
    createTransport(options: {
      host: string;
      port: number;
      secure: boolean;
      requireTLS: boolean;
      connectionTimeout: number;
      greetingTimeout: number;
      socketTimeout: number;
      auth: { user: string; pass: string };
    }): Transporter;
  };

  export default nodemailer;
}
