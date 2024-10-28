import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter().catch(error => {
      this.logger.error('Failed to initialize email transporter:', error);
    });
  }

  private async initializeTransporter() {
    try {
      const OAuth2 = google.auth.OAuth2;
      const oauth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });

      const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            reject('Failed to create access token');
          }
          resolve(token);
        });
      });

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken as string,
        },
      });
    } catch (error) {
      this.logger.error('Error initializing email transporter:', error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, templateData: any) {
    const transporter = this.transporter;

    const templatePath = path.join(process.cwd(), 'src', 'templates', 'emailTemplate.hbs');
    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(source);

    // Base64 encoded logo (replace this with your actual base64 encoded logo)
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA...';

    const html = template({
      subject,
      companyName: process.env.COMPANY_NAME,
      currentYear: new Date().getFullYear(),
      logoBase64,
      ...templateData,
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [{
        filename: 'logo.png',
        path: path.join(process.cwd(), 'public', 'images', 'logo.png'),
        cid: 'companyLogo'
      }]
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  async sendOTP(email: string, otp: string) {
    // Send email asynchronously without waiting
    this.sendEmailAsync(email, otp).catch(error => {
      this.logger.error(`Failed to send OTP email: ${error.message}`);
    });
    
    return true;
  }

  private async sendEmailAsync(email: string, otp: string) {
    try {
      await this.sendEmail(email, 'Your OTP for signup', { otp });
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }
}
