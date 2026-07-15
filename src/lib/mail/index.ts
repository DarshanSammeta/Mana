import "server-only";
import { Resend } from 'resend';
import { EMAIL_CONFIG } from '@/config/email';

let resendInstance: Resend | null = null;

const getResend = () => {
  if (typeof window !== "undefined") return null;
  if (resendInstance) return resendInstance;

  const apiKey = EMAIL_CONFIG.resendApiKey;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is missing, Resend service will be unavailable.');
    return null;
  }

  try {
    resendInstance = new Resend(apiKey);
    return resendInstance;
  } catch (error) {
    console.error('Failed to initialize Resend:', error);
    return null;
  }
};

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailOptions) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn('Resend instance not available, skipping email.');
      return null;
    }

    const result = await resend.emails.send({
      from: from || EMAIL_CONFIG.from.system,
      to,
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    return null;
  }
};
