import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if email is configured
      if (
        !env.SMTP_HOST ||
        !env.SMTP_PORT ||
        !env.SMTP_USER ||
        !env.SMTP_PASS
      ) {
        console.warn(
          '⚠️  Email not configured. Using console fallback for development.'
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT),
        secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // For development/testing
        },
      });

      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If no transporter (not configured), use console fallback
      if (!this.transporter) {
        console.log('📧 [EMAIL] → Console fallback (not configured)');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML: ${options.html}`);
        return true;
      }

      const mailOptions = {
        from: `"${env.NEXT_PUBLIC_BRAND_NAME}" <${env.SMTP_FROM || env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<boolean> {
    const template = this.getPasswordResetTemplate(resetLink);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(name);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendOrderConfirmationEmail(
    email: string,
    orderNumber: string,
    orderDetails: any
  ): Promise<boolean> {
    const template = this.getOrderConfirmationTemplate(
      orderNumber,
      orderDetails
    );

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getPasswordResetTemplate(resetLink: string): EmailTemplate {
    return {
      subject: 'Восстановление пароля - MarinaObuv',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Восстановление пароля</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">Восстановление пароля</h1>
            
            <p>Здравствуйте!</p>
            
            <p>Вы запросили восстановление пароля для вашего аккаунта в MarinaObuv.</p>
            
            <p>Для создания нового пароля нажмите на кнопку ниже:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Восстановить пароль
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
              <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Важно:</strong> Эта ссылка действительна в течение 24 часов. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              С уважением,<br>
              Команда MarinaObuv
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Восстановление пароля - MarinaObuv

Здравствуйте!

Вы запросили восстановление пароля для вашего аккаунта в MarinaObuv.

Для создания нового пароля перейдите по ссылке:
${resetLink}

Важно: Эта ссылка действительна в течение 24 часов. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.

С уважением,
Команда MarinaObuv
      `,
    };
  }

  private getWelcomeTemplate(name: string): EmailTemplate {
    return {
      subject: 'Добро пожаловать в MarinaObuv!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Добро пожаловать</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">Добро пожаловать в MarinaObuv!</h1>
            
            <p>Здравствуйте, ${name}!</p>
            
            <p>Спасибо за регистрацию в нашем интернет-магазине обуви. Теперь вы можете:</p>
            
            <ul style="padding-left: 20px;">
              <li>Просматривать наш каталог обуви</li>
              <li>Делать заказы с доставкой</li>
              <li>Отслеживать статус заказов</li>
              <li>Получать уведомления о новых поступлениях</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${env.NEXT_PUBLIC_SITE_URL}/catalog" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Перейти в каталог
              </a>
            </div>
            
            <p>Если у вас есть вопросы, не стесняйтесь обращаться к нам!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              С уважением,<br>
              Команда MarinaObuv
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Добро пожаловать в MarinaObuv!

Здравствуйте, ${name}!

Спасибо за регистрацию в нашем интернет-магазине обуви. Теперь вы можете:

• Просматривать наш каталог обуви
• Делать заказы с доставкой
• Отслеживать статус заказов
• Получать уведомления о новых поступлениях

Перейти в каталог: ${env.NEXT_PUBLIC_SITE_URL}/catalog

Если у вас есть вопросы, не стесняйтесь обращаться к нам!

С уважением,
Команда MarinaObuv
      `,
    };
  }

  private getOrderConfirmationTemplate(
    orderNumber: string,
    orderDetails: any
  ): EmailTemplate {
    return {
      subject: `Подтверждение заказа #${orderNumber} - MarinaObuv`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение заказа</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">Заказ подтвержден!</h1>
            
            <p>Спасибо за ваш заказ! Мы получили заказ #${orderNumber} и обрабатываем его.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Детали заказа:</h3>
              <p><strong>Номер заказа:</strong> #${orderNumber}</p>
              <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
              <p><strong>Статус:</strong> Обрабатывается</p>
            </div>
            
            <p>Мы свяжемся с вами в ближайшее время для подтверждения деталей заказа.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${env.NEXT_PUBLIC_SITE_URL}/orders" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Отследить заказ
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              С уважением,<br>
              Команда MarinaObuv
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Подтверждение заказа #${orderNumber} - MarinaObuv

Спасибо за ваш заказ! Мы получили заказ #${orderNumber} и обрабатываем его.

Детали заказа:
- Номер заказа: #${orderNumber}
- Дата: ${new Date().toLocaleDateString('ru-RU')}
- Статус: Обрабатывается

Мы свяжемся с вами в ближайшее время для подтверждения деталей заказа.

Отследить заказ: ${env.NEXT_PUBLIC_SITE_URL}/orders

С уважением,
Команда MarinaObuv
      `,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
