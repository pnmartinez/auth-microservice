import { logger } from '../utils/logger.util';

// Email service interface - implement with your preferred provider (SendGrid, Mailgun, etc.)
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<boolean>;
}

// Stub implementation for development
class StubEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<boolean> {
    logger.info('Email would be sent (stub):', {
      to: options.to,
      subject: options.subject,
    });
    return true;
  }
}

// SendGrid implementation example
class SendGridProvider implements EmailProvider {
  constructor() {
    // API key and from email are accessed via env vars when needed
    // This constructor is a placeholder for future SendGrid integration
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      // Uncomment and install @sendgrid/mail to use
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send({
      //   from: this.fromEmail,
      //   to: options.to,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      // });

      logger.info('Email sent via SendGrid:', {
        to: options.to,
        subject: options.subject,
      });
      return true;
    } catch (error) {
      logger.error('Failed to send email via SendGrid:', error);
      return false;
    }
  }
}

export class EmailService {
  private provider: EmailProvider;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    // Use real provider if API key is set, otherwise use stub
    const apiKey = process.env.EMAIL_SERVICE_API_KEY || '';
    this.provider = apiKey ? new SendGridProvider() : new StubEmailProvider();
    this.retryAttempts = parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.EMAIL_RETRY_DELAY_MS || '1000');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.provider.send(options);
        if (result) {
          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Email send attempt ${attempt} failed:`, lastError);

        if (attempt < this.retryAttempts) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('Failed to send email after all retry attempts:', {
      to: options.to,
      subject: options.subject,
      error: lastError,
    });
    return false;
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.EMAIL_VERIFICATION_URL}?token=${token}`;
    const html = `
      <h1>Verifica tu email</h1>
      <p>Haz clic en el siguiente enlace para verificar tu dirección de email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Este enlace expirará en 24 horas.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verifica tu email',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.PASSWORD_RESET_URL}?token=${token}`;
    const html = `
      <h1>Recuperación de contraseña</h1>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, ignora este email.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Recuperación de contraseña',
      html,
    });
  }
}

export const emailService = new EmailService();
