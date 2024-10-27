import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  private async createTransporter() {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      this.configService.get('GMAIL_CLIENT_ID'),
      this.configService.get('GMAIL_CLIENT_SECRET'),
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: this.configService.get('GMAIL_REFRESH_TOKEN'),
    });

    const accessToken = await new Promise<string>((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject('Failed to create access token');
        }
        resolve(token);
      });
    });

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get('GMAIL_USER'),
        accessToken,
        clientId: this.configService.get('GMAIL_CLIENT_ID'),
        clientSecret: this.configService.get('GMAIL_CLIENT_SECRET'),
        refreshToken: this.configService.get('GMAIL_REFRESH_TOKEN'),
      },
    });
  }

  async sendEmail(to: string, subject: string, templateData: any) {
    const transporter = await this.createTransporter();

    const templatePath = path.join(process.cwd(), 'src', 'templates', 'emailTemplate.hbs');
    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(source);

    // Base64 encoded logo (replace this with your actual base64 encoded logo)
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA...';

    const html = template({
      subject,
      companyName: this.configService.get('COMPANY_NAME'),
      currentYear: new Date().getFullYear(),
      logoBase64,
      ...templateData,
    });

    const mailOptions = {
      from: `"${this.configService.get('COMPANY_NAME')}" <${this.configService.get('GMAIL_USER')}>`,
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
    await this.sendEmail(email, 'Your OTP for signup', { otp });
  }
}
