declare module 'nodemailer' {
  export interface Transporter {
    sendMail(options: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<unknown>;
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
